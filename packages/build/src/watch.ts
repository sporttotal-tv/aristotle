import chokidar from 'chokidar'
import createBuild from './createBuild'
import parseBuild from './parseBuild'
import { join, isAbsolute } from 'path'

const bundleStore = new Map()
const bundleCache = new Map()
const cwd = process.cwd()

const parseMeta = result =>
  JSON.parse(
    result.outputFiles.find(({ path }) => /\/meta\.json$/.test(path)).text
  )

const watch = async (opts, cb) => {
  let res
  if (bundleStore.has(opts)) {
    const store = bundleStore.get(opts)
    // rebuild it
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
    // result
    res = await parseBuild(opts, result, store.files, store.dependencies)
  } else {
    // first build
    const { result, files, dependencies } = await createBuild(opts, true)
    const meta = parseMeta(result)
    // create new watcher
    const watcher = chokidar.watch(Object.keys(meta.inputs))

    watcher.on('change', file => {
      // remove file from style cache
      delete files.fileCache[isAbsolute(file) ? file : join(cwd, file)]
      // update bundleCache
      bundleCache.set(opts, watch(opts, cb))
    })

    // store for reuse
    bundleStore.set(opts, {
      dependencies,
      watcher,
      files,
      result,
      meta
    })

    res = await parseBuild(opts, result, files, dependencies)
  }

  cb(res)
  return res
}

export default (opts, cb) => {
  if (!bundleCache.has(opts)) {
    bundleCache.set(opts, watch(opts, cb))
  }
  return bundleCache.get(opts).catch(parseBuild)
}
