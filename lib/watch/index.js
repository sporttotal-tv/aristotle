const chokidar = require('chokidar')
const { removeCache } = require('../file/cache')

const createWatcher = store => {
  if (store.watcher) {
    return store.watcher
  }

  const watcher = {}

  const watcherInternal = chokidar.watch('file', {
    ignored: /(^|[/\\])\../,
    persistent: true
  })

  watcher.watcherInternal = watcherInternal

  watcher.removed = {}

  watcher.listeners = []

  watcher.on = fn => {
    watcher.listeners.push(fn)
  }

  watcher.active = {}

  const findFile = (path, type) => {
    const paths = store.resolvedToPath[path]
    if (paths) {
      paths.forEach(p => {
        const file = store.files[p]
        if (file) {
          // if (!store.pending[p]) {
          //   removeCache(file)
          //   delete store.files[p]
          // }
          // if (type === 'remove') {
          delete store.pending[p]
          removeCache(file)
          delete store.files[p]
          delete store.files[file.resolved.browser]
          delete store.files[file.resolved.node]
          delete store.files[file.resolved.original]
          delete store.files[file.resolved.path]
          delete store.resolved[file.resolved.browser]
          delete store.resolved[file.resolved.node]
          delete store.resolved[file.resolved.path]
          delete store.resolved[file.resolved.original]
          // }
        }
      })
    }
  }

  const changeFile = path => {
    watcher.listeners.forEach(fn => fn('change', path))
    findFile(path)
  }

  const removeFile = path => {
    watcher.listeners.forEach(fn => fn('remove', path))
    findFile(path, 'remove')
  }

  const watch = async path => {
    if (!store.watcher.active[path]) {
      store.watcher.watcherInternal.add(path)
    }
  }

  watcherInternal
    .on('add', path => {
      if (watcher.removed[path]) {
        delete watcher.removed[path]
        changeFile(path)
      }
    })
    .on('change', changeFile)
    .on('unlink', path => {
      watcher.removed[path] = true
      removeFile(path)
      // may need to add unwatch here
    })

  watcher.watch = watch

  store.watcher = watcher

  // for all current paths
  for (let path in store.resolvedToPath) {
    watch(path)
  }
}

exports.createWatcher = createWatcher
