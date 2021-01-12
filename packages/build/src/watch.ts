import chokidar from 'chokidar'
import WebSocket from 'ws'
import createBuild from './createBuild'
import parseBuild from './parseBuild'
import { join, isAbsolute } from 'path'

const bundleStore = new Map()
const bundleCache = new Map()
const cwd = process.cwd()

const parseMeta = result => {
  return JSON.parse(
    result.outputFiles.find(({ path }) => /\/meta\.json$/.test(path)).text
  )
}

const broadcast = client => {
  if (client.readyState === WebSocket.OPEN) {
    client.send('')
  }
}

const watch = async opts => {
  if (bundleStore.has(opts)) {
    const store = bundleStore.get(opts)
    // rebuild
    const result = await store.result.rebuild()
    const meta = parseMeta(result)
    // unwatch removed files
    for (const file in store.meta.inputs) {
      if (!(file in meta.inputs)) {
        store.watcher.unwatch(file)
      }
    }
    // add new files
    for (const file in meta.inputs) {
      if (!(file in store.meta.inputs)) {
        store.watcher.add(file)
      }
    }
    // store new meta
    store.meta = meta
    // add livereload
    result.outputFiles.push(store.livereload)
    // result
    return parseBuild(result, store.styles)
  }
  // first build
  const { result, styles } = await createBuild(opts)
  const meta = parseMeta(result)
  // create livereload server
  const port = 2222 // use find port
  const { clients } = new WebSocket.Server({ port })
  const script = `(function connect (timeout) {
    var host = window.location.hostname
    if (!timeout) timeout = 0
    setTimeout(function () {
        var socket = new WebSocket('ws://' + host + ':${port}')
        socket.addEventListener('message', function () {
        location.reload()
        })
        socket.addEventListener('open', function () {
        if (timeout > 0) location.reload()
        console.log('🛸 dev server connected')
        })
        socket.addEventListener('close', function () {
        console.log('🛸 dev server reconnecting...')
        connect(Math.min(timeout + 1000), 3000)
        })
    }, timeout)
    })();`

  const livereload = {
    path: '/livereload.js',
    text: script,
    contents: script
  }

  // create new watcher
  const watcher = chokidar.watch(Object.keys(meta.inputs))
  watcher.on('change', file => {
    // remove file from style cache
    delete styles.fileCache[isAbsolute(file) ? file : join(cwd, file)]
    // update bundleCache
    bundleCache.set(opts, watch(opts))
    // broadcast reload
    clients.forEach(broadcast)
  })
  // store for reuse
  bundleStore.set(opts, {
    livereload,
    watcher,
    styles,
    result,
    meta
  })
  // add livereload
  // @ts-ignore
  result.outputFiles.push(livereload)
  // result
  return parseBuild(result, styles)
}

export default opts => {
  if (!bundleCache.has(opts)) {
    bundleCache.set(opts, watch(opts))
  }
  return bundleCache.get(opts).catch(parseBuild)
}
