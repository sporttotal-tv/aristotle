const { build } = require('./build')
const { parseFile } = require('./file')
const { production } = require('./production')
const { buildProduction } = require('./production/build')
const chalk = require('chalk')
const createServer = require('./server')
const { createWatcher } = require('./watch')

const store = {
  files: {},
  pending: {},
  resolved: {},
  paths: {},
  resolvedToPath: {}
}

exports.store = store

// store.noCache = true

exports.build = async (path, type) => {
  var d = Date.now()
  const result = await build({ store, path, type })
  console.log(chalk.blue(`\n⚡️  build ${path} in ${Date.now() - d}ms`))
  return result
}

exports.production = async (
  path,
  dest = '/dist',
  { type, minify = true, cache = true, compressImages = true } = {}
) => {
  const d = Date.now()
  if (!cache) {
    store.cache = false
  }
  const result = await production({
    store,
    path,
    dest,
    type,
    minify,
    compressImages
  })
  console.log(
    chalk.blue(
      `⚡️  Generated production build ${path} in ${Date.now() - d}ms"`
    )
  )
  return result
}

exports.buildProduction = async (path, type) => {
  const d = Date.now()
  const result = await buildProduction({ store, path, type })
  console.log(
    chalk.blue(
      `⚡️  Generated production build ${path} in ${Date.now() - d}ms"`
    )
  )
  return result
}

exports.watch = async (path, callback, type) => {
  const exec = async () => {
    var d = Date.now()
    const result = await build({ store, path, type })
    console.log(chalk.blue(`\n⚡️  build ${path} in ${Date.now() - d}ms`))
    callback(result)
  }

  createWatcher(store)

  store.watcher.on(() => exec())

  exec()
}

exports.parseFile = async path => parseFile({ store, path })

exports.startServer = async (path, port) => {
  if (!port) throw new Error('StartServer - please specify a port')
  const update = await createServer(store, port, path)
  exports.watch(path, result => {
    const { browserBundle } = result
    const files = {
      js: {
        path: `/${browserBundle.codeHash}.js`,
        contents: browserBundle.code
      },
      css: {
        path: browserBundle.css ? `/${browserBundle.cssHash}.css` : '',
        contents: browserBundle.css
      }
    }
    for (let key in browserBundle.bundleMap) {
      const bundle = browserBundle.bundleMap[key]
      files[key] = {
        path: `/${bundle.codeHash}.js`,
        contents: bundle.code
      }
      if (bundle.css) {
        files[key + '_css'] = {
          path: `/${bundle.cssHash}.css`,
          contents: bundle.css
        }
      }
    }
    update(files, result.server, result.errors)
  })
}
