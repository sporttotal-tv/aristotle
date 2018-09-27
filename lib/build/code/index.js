const hash = require('string-hash')
const parseJs = require('./js.js')
const parseCss = require('./css.js')
const parseJson = require('./json.js')

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
  return `var __dynamicModules__ = ${JSON.stringify(obj)};`
}

const generateCode = props => {
  const { bundle, bundleMap, type } = props
  if (!bundle.requiredInBundle) {
    bundle.files.forEach(file => {
      if (file.type === 'js') {
        parseJs({ file, ...props })
      } else if (file.type === 'json') {
        parseJson({ file, ...props })
      } else if (file.type === 'css') {
        parseCss({ file, ...props })
      }
    })

    for (let key in bundle.styles) {
      if (!hasStyle(bundle.parent, key)) {
        bundle.cssChunks.push(bundle.styles[key])
      }
    }

    for (let key in bundle.bundles) {
      generateCode({ ...props, bundle: bundle.bundles[key] })
    }

    bundle.code = bundle.js.join('\n')
    bundle.css = bundle.cssChunks.join('\n')
    bundle.cssHash = hash(bundle.css).toString(36)
    bundle.codeHash = hash(bundle.code).toString(36)
    bundle.bundleMap = bundleMap

    if (bundle.isRoot && Object.keys(bundleMap).length) {
      bundle.code = generateDynamicImportsMap(bundleMap) + bundle.code
    }

    bundle.code = '\n' + bundle.vars.join('\n') + bundle.code

    if (type === 'browser') {
      bundle.code = `(function (global, module) {\n ${
        bundle.code
      } \n})(window, {});`
    }
  } else {
    delete bundleMap[bundle.path]
  }
}

exports.generateCode = generateCode
