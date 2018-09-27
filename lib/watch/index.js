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

  const findFile = path => {
    const paths = store.resolvedToPath[path]
    paths.forEach(path => {
      const file = store.files[path]
      if (file && !store.pending[path]) {
        removeCache(file)
        delete store.files[path]
      }
    })
  }

  const changeFile = path => {
    watcher.listeners.forEach(fn => fn('change', path))
    findFile(path)
  }

  const removeFile = path => {
    watcher.listeners.forEach(fn => fn('remove', path))
    findFile(path)
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
