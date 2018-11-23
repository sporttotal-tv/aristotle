const resolve = require('./resolve')
const { isJson, isCss } = require('./resolve/match')
const json = require('./json')
const js = require('./js')
const css = require('./css')
const File = require('./file')
const getContent = require('./content')
const { getCache, setCache } = require('./cache')

const createFile = async (resolved, path, store) => {
  let file = new File({ resolved, store })
  file.path = path

  const cached = await getCache(file)

  if (cached) {
    if (!isCss(path) && !isJson(path)) {
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
      if (isCss(path)) {
        css(file)
      } else if (isJson(path)) {
        json(file)
      } else {
        js(file)
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
    if (!store.tmp) store.tmp = {}

    if (store.tmp[resolved.path]) {
      return pending[store.tmp[resolved.path]]
    }

    store.tmp[resolved.path] = path
    // console.log('\n\ngurf', resolved.path, path)

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
    console.log(err)
    throw new Error(`Fatal error - Cannot resolve path ${path}`)
  }

  file = await createFile(resolved, path, store)

  delete pending[path]
  delete store.tmp[resolved.path]

  pathsForWatcher(store, path, resolved)

  store.files[path] = store.files[resolved.path] = file

  return file
}

const parseFile = async ({ store, path }) => {
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
