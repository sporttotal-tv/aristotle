const resolve = require('./resolve')
const { isJson, isCss, isGql, isNativeNode } = require('./resolve/match')
const json = require('./json')
const gql = require('./gql')
const js = require('./js')
const css = require('./css')
const nativeNode = require('./nativeNode')
const File = require('./file')
const getContent = require('./content')
const { getCache, setCache } = require('./cache')
const { normalizePath } = require('../util/file')
const findNativeModules = require('./findNativeModules')
const { join } = require('path')

const createFile = async (resolved, path, store) => {
  let file = new File({ resolved, store })
  file.path = path

  const cached = await getCache(file)

  if (cached) {
    if (!isCss(path) && !isJson(path) && !isGql(path)) {
      js(cached, true)
    }
    return cached
  } else {
    let content
    try {
      content = await getContent(resolved, store)
    } catch (err) {
      file.error = err
    }
    file.content = content

    if (resolved.isEqual) {
      file.node = file.browser = {}
    } else {
      file.node = {}
      file.browser = {}
    }

    if (!file.error) {
      if (!resolved.notNative && isNativeNode(path)) {
        nativeNode(file)
      } else if (isGql(path)) {
        gql(file)
      } else if (isCss(path)) {
        css(file)
      } else if (isJson(path)) {
        json(file)
      } else {
        js(file)
      }

      if (
        file.node.parsed &&
        file.node.parsed.dynamicRequires &&
        file.node.parsed.dynamicRequires.length
      ) {
        await findNativeModules(file, file.node.parsed.dynamicRequires)
        // console.dir(file.node, { depth: null })
      }
    }

    await setCache(file)

    return file
  }
}

const pathsForWatcher = (store, path, resolved) => {
  var nodeResolved = store.resolvedToPath[resolved.node]
  var browserResolved = store.resolvedToPath[resolved.browser]
  if (!nodeResolved) {
    nodeResolved = store.resolvedToPath[resolved.node] = []
  }
  if (!browserResolved) {
    browserResolved = store.resolvedToPath[resolved.browser] = []
  }

  if (!nodeResolved.includes(path)) {
    nodeResolved.push(path)
  }

  if (!browserResolved.includes(path)) {
    browserResolved.push(path)
  }
}

const pendingFile = async ({ store, path }) => {
  let file
  const pending = store.pending
  let resolved = {}
  try {
    resolved = await resolve(store, path)
    if (store.files[resolved.path]) {
      pathsForWatcher(store, path, resolved)
      file = store.files[path] = await parseFile({
        store,
        path: resolved.path
      })
      delete pending[path]
      return file
    } else if (store.files[resolved.original]) {
      pathsForWatcher(store, path, resolved)
      delete pending[path]
      file = store.files[path] = await parseFile({
        store,
        path: resolved.original
      })
      delete pending[path]
      return file
    }
  } catch (err) {
    // console.log(err)
    // throw new Error(`Fatal error - Cannot resolve path ${path}`)
  }

  // nativeModulesLocation
  if (!store.cacheLocation) {
    store.cacheLocation = join(resolved.pkgDir, '.cache')
    if (store.dest) {
      store.nativeModulesLocation = join(store.dest, 'nativeModules')
    } else {
      store.nativeModulesLocation = store.cacheLocation
    }
  }

  file = await createFile(resolved, path, store)
  delete pending[path]
  pathsForWatcher(store, path, resolved)
  store.files[path] = file
  return file
}

const parseFile = async ({ store, path }) => {
  path = normalizePath(path)
  const file = store.files[path]

  const pending = store.pending
  if (!file) {
    if (pending[path]) {
      return pending[path]
    } else {
      return (pending[path] = pendingFile({ store, path }))
    }
  } else {
    return file
  }
}

exports.parseFile = parseFile
