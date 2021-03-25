import chokidar from 'chokidar'
import createBuild from './createBuild'
import parseBuild from './parseBuild'
import { join, isAbsolute } from 'path'
import exitHook from 'exit-hook'
import { BuildOpts, WatchCb } from './'
import { BuildResult } from '@sporttotal/aristotle-types'

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

const watch = async (opts: BuildOpts, cb: WatchCb): Promise<BuildResult> => {
  const store = bundleStore.get(opts)
  let res

  if (store && !store.result.errors) {
    // reset paths
    const prevPaths = store.meta.paths
    const newPaths = (store.meta.paths = new Set())
    // reset errors
    store.meta.errors = []
    // rebuild it
    const result = await store.result.rebuild().catch((e) => e)
    res = await parseBuild(opts, result, store.meta)
    // unwatch removed files
    for (const path in prevPaths) {
      if (!newPaths.has(path)) {
        store.watcher.unwatch(path)
      }
    }
    // add new files
    for (const path of newPaths) {
      // @ts-ignore
      if (!(path in prevPaths)) {
        store.watcher.add(path)
      }
    }
  } else {
    // first build
    const { result, meta } = await createBuild(opts, true)
    res = await parseBuild(opts, result, meta)

    if (!store) {
      // create new watcher
      // @ts-ignore
      const watcher = chokidar.watch(Array.from(meta.paths))
      const update = (file) => {
        // remove file from file cache
        delete meta.fileCache[isAbsolute(file) ? file : join(cwd, file)]
        // update bundleCache
        bundleCache.set(opts, watch(opts, cb))
      }
      watcher.on('change', update)
      watcher.on('unlink', update)
      // store for reuse
      bundleStore.set(opts, {
        watcher,
        meta,
        result,
      })
    }
  }

  cb(res)

  return res
}

export default (opts: BuildOpts, cb: WatchCb): Promise<BuildResult> => {
  if (!bundleCache.has(opts)) {
    bundleCache.set(opts, watch(opts, cb))
  }
  return bundleCache.get(opts)
}
