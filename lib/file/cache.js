const { join } = require('path')
const fs = require('mz/fs')
const hash = require('string-hash')
const chalk = require('chalk')
const version = require('../../package.json').version

const cacheKey = file => {
  if (
    file.store.cache &&
    !file.store.cache.err &&
    !file.store.noCache &&
    file.pkg &&
    file.path.indexOf('node_modules') !== -1 &&
    (file.pkg.version ||
      (file.pkg._requested && file.pkg._requested.type === 'git')) &&
    !fs.statSync(file.path).isSymbolicLink()
  ) {
    return `${file.id}-${hash(
      (file.pkg._requested && file.pkg._requested.type === 'git'
        ? file.pkg._requested.raw
        : file.pkg.version
      ).toString(36)
    )}-${file.store.cache.hash}-${process.env.NODE_ENV || 'development'}.json`
  } else {
    return ''
  }
}

const generateName = file => {
  const id = file.pkg
    ? file.pkg._requested && file.pkg._requested.type === 'git'
      ? file.pkg._requested.raw
      : file.pkg.name + '@' + file.pkg.version
    : file.path

  return (
    chalk.white(process.env.NODE_ENV || 'development') +
    ' ' +
    id +
    ' ' +
    (id.length < 40 ? file.path.replace(file.resolved.pkgDir, '') : '...')
  )
}

const setCache = async file => {
  const key = cacheKey(file)
  const store = file.store
  if (key && !store.cache[key]) {
    const path = join(store.cacheLocation, key)
    store.cache[key] = true
    try {
      // console.log(JSON.stringiy(file.browser) === JSON.stringiy(file.node))
      await fs.writeFile(path, file.toJSON(), 'utf-8')
      console.log(`• Add ${generateName(file)} to global cache`)
    } catch (e) {
      console.log(chalk.red('- Error adding to cache', file.path, path))
    }
  }
}

const createCacheStore = async store => {
  const cachePath = store.cacheLocation
  const id = hash(process.env.NODE_ENV + version).toString(36)
  try {
    const cache = await fs.exists(cachePath)
    if (!cache) {
      await fs.mkdir(cachePath)
      store.cache = { hash: id }
      console.log('• Create cache')
    } else {
      const files = await fs.readdir(cachePath)
      store.cache = {
        hash: id
      }
      files.forEach(path => {
        store.cache[path] = true
      })
    }
  } catch (err) {
    store.cache = { err }
    console.log(chalk.red('• Cannot initialize cache store'))
  }
}

const createCache = async store => {
  if (!store.cacheBeingCreated) {
    store.cacheBeingCreated = createCacheStore(store)
  }
  await store.cacheBeingCreated
}

const addToFile = (file, cached) => {
  file.type = cached.type
  file.node = cached.node
  file.browser = cached.browser
  return file
}

const getCache = async file => {
  const store = file.store
  if (!store.cache) {
    await createCache(store)
  }
  const key = cacheKey(file)
  // file.pkg._id to check if a module is external - can become a bit stronger e.g. checking for github deps
  if (key && store.cache[key] && file.pkg._id) {
    try {
      // console.log(`• From cache ${generateName(file)}`)
      const cached = JSON.parse(
        (await fs.readFile(join(store.cacheLocation, key))).toString()
      )
      if (cached) {
        return addToFile(file, cached)
      }
    } catch (err) {
      console.log(
        chalk.red('• Cannot initialize cache store'),
        store.cacheLocation,
        err.message
      )
    }
  }
}

const removeCache = file => {
  const store = file.store
  if (store.cache) {
    const key = cacheKey(file)
    if (store.cache[key]) {
      delete store.cache[key]
    }
  }
}

exports.getCache = getCache
exports.setCache = setCache
exports.removeCache = removeCache
