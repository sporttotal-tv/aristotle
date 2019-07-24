const hash = require('string-hash')
const parseJs = require('./js.js')
const parseCss = require('./css.js')
const parseJson = require('./json.js')
const postcss = require('./postcss')
const parseNativeNode = require('./nativeNode')
const fs = require('mz/fs')
const { join, parse, sep } = require('path')

const hasStyle = (bundle, style) => {
  while (bundle) {
    if (bundle.styles[style]) {
      return true
    }
    bundle = bundle.parent
  }
}

const generateDynamicImportsMap = bundleMap => {
  var obj = {}
  for (let key in bundleMap) {
    const bundle = bundleMap[key]
    obj[bundle.id] = {
      js: bundle.codeHash + '.js',
      css: bundle.css ? bundle.cssHash + '.css' : false
    }
  }
  return `\nvar __dynamicModules__ = ${JSON.stringify(obj)};`
}

const generateCode = async props => {
  const { bundle, bundleMap, type } = props
  if (!bundle.requiredInBundle) {
    bundle.files.forEach(file => {
      if (file.error) {
        if (!bundle.errors) {
          bundle.errors = {}
        }
        bundle.errors[file.path] = file
      }

      if (file.type === 'js') {
        parseJs({ file, ...props })
      } else if (file.type === 'json') {
        parseJson({ file, ...props })
      } else if (file.type === 'css') {
        parseCss({ file, ...props })
      } else if (file.type === 'nativeNode') {
        parseNativeNode({ file, ...props })
      }
    })

    for (let key in bundle.styles) {
      if (!hasStyle(bundle.parent, key)) {
        bundle.cssChunks.push(bundle.styles[key].css)
      }
    }

    for (let key in bundle.bundles) {
      await generateCode({ ...props, bundle: bundle.bundles[key] })
    }

    bundle.code = bundle.js.join('\n')
    bundle.css = bundle.cssChunks.join('\n')
    bundle.es2015 = bundle.jsEs2015.join('\n')

    await postcss(bundle)

    bundle.bundleMap = bundleMap

    if (bundle.isRoot && Object.keys(bundleMap).length) {
      bundle.code = generateDynamicImportsMap(bundleMap) + bundle.code
      bundle.es2015 = generateDynamicImportsMap(bundleMap) + bundle.es2015
    }

    bundle.code = '\n' + bundle.vars.join('\n') + '\n' + bundle.code
    bundle.es2015 = '\n' + bundle.vars.join('\n') + '\n' + bundle.es2015

    // add post css here
    bundle.cssHash = hash(bundle.css).toString(36)
    bundle.codeHash = hash(bundle.code).toString(36)

    if (type === 'node') {
      // tmp folder - needs .aristotle folder for this!!!
      const fileMap = {}
      let production =
        bundle.store.nativeModulesLocation !== bundle.store.cacheLocation
      for (let i = 0; i < bundle.nativeNode.length; i++) {
        const file = bundle.nativeNode[i]
        const nativeModulesLocation = bundle.store.nativeModulesLocation
        const { base } = parse(file.resolved.node)
        const dest = join(nativeModulesLocation, base)

        const exists = await fs.exists(nativeModulesLocation)

        if (!exists) {
          const p = nativeModulesLocation.split(sep)
          for (let i = 1; i < p.length + 1; i++) {
            const dirPath = join(...p.slice(0, i))
            const exists = await fs.exists(dirPath)
            if (!exists) {
              await fs.mkdir(dirPath)
            }
          }
        }

        if (production) {
          fileMap[base] = join('nativeModules', base)
        } else {
          fileMap[base] = dest
        }

        // nativeModulesLocation
        await fs.copyFile(file.resolved.node, dest)
      }

      bundle.code =
        `
        const _reqFileMap = ${JSON.stringify(fileMap, false, 2)}
        console.log('override require system to import native modules from a centralized location')
        const _oldRequireMethod = require
        require = (file) => {
          let x
          try {
            x = _oldRequireMethod(file)
          } catch (err) {
            const path = _oldRequireMethod('path')
            const base = path.parse(file).base
            console.log(__dirname, _reqFileMap[base])
            const native = ${
              production
                ? 'path.join(__dirname, "../", _reqFileMap[base])'
                : '_reqFileMap[base]'
            }
            console.log(native)
            if (native) {
              console.log('found native module "' + file + '"')
              return _oldRequireMethod(native)
            } else {
              throw(err)
            }
          }
          return x
        }
      ` + bundle.code

      // if production put in dist folder
    } else if (type === 'browser') {
      // bundle.coreCode = bundle.code
      bundle.code = `(function (global, module) {\n ${
        bundle.code
      } \n})(window, {});`

      bundle.es2015 = `(function (global, module) {\n ${
        bundle.es2015
      } \n})(window, {});`

      if (bundle.isRoot) {
        const poly = await fs.readFile(join(__dirname, '/polyfill.min.js'))
        bundle.es2015 =
          '\n// ======= start of polyfill =======\n' +
          ';' +
          poly +
          ';' +
          '\n// ======= end of polyfill =======\n' +
          bundle.es2015
      }
    }
  } else {
    delete bundleMap[bundle.path]
  }
}

exports.generateCode = generateCode
