import chokidar from 'chokidar'
import createBuild from './createBuild'
import parseBuild from './parseBuild'
import { join, isAbsolute } from 'path'
import exitHook from 'exit-hook'

const bundleStore = new Map()
const bundleCache = new Map()
const cwd = process.cwd()

exitHook(() => {
  for (const [, { result }] of bundleStore) {
    if (result.rebuild) {
      result.rebuild.dispose()
    }
  }
})

const watch = async (opts, cb) => {
  const store = bundleStore.get(opts)
  let res
  if (store && !store.result.errors) {
    // reset paths
    const prevPaths = store.files.paths
    const newPaths = (store.files.paths = new Set())
    // rebuild it
    const result = await store.result.rebuild().catch(e => e)
    res = await parseBuild(opts, result, store.files, store.dependencies)
    // unwatch removed files
    for (const path in prevPaths) {
      if (!newPaths.has(path)) {
        store.watcher.unwatch(path)
      }
    }
    // add new files
    for (const path in newPaths) {
      if (!(path in prevPaths)) {
        store.watcher.add(path)
      }
    }
  } else {
    // first build
    const { result, files, dependencies } = await createBuild(opts, true)
    res = await parseBuild(opts, result, files, dependencies)

    if (!store) {
      // create new watcher
      // @ts-ignore
      const watcher = chokidar.watch(Array.from(files.paths))
      watcher.on('change', file => {
        // remove file from file cache
        delete files.fileCache[isAbsolute(file) ? file : join(cwd, file)]
        // update bundleCache
        bundleCache.set(opts, watch(opts, cb))
      })
      // store for reuse
      bundleStore.set(opts, {
        dependencies,
        watcher,
        files,
        result
      })
    }
  }

  cb(res)

  return res
}

export default (opts, cb) => {
  if (!bundleCache.has(opts)) {
    bundleCache.set(opts, watch(opts, cb))
  }
  return bundleCache.get(opts)
}
