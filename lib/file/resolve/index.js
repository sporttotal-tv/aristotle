const fs = require('mz/fs')
const { findPkg } = require('./package')
const { join, basename, dirname } = require('path')
const f = require('../index.js')
const { browserResolve } = require('./browser')
const { isFile } = require('./match')
const { parseFilePath, moduleId, relativePath } = require('./path')
const resolveFrom = require('resolve-from')

const resolvePkg = (store, path) => {
  const pkgDir = dirname(path)
  return (store.resolved[path] = {
    browser: path,
    node: path,
    pkgDir,
    path,
    original: path,
    pkgFile: path,
    id: moduleId(relativePath(path, pkgDir)),
    isEqual: true
  })
}

const resolve = async (store, path) => {
  const base = basename(path)
  if (base === 'package.json') {
    return resolvePkg(store, path)
  }

  const original = path
  let pkgDir, pkgFile, pkg

  try {
    pkgDir = await findPkg(path)
    pkgFile = join(pkgDir, 'package.json')
    pkg = await f.parseFile({ store, path: pkgFile })
  } catch (err) {
    throw err
  }

  const pkgParsed = pkg.node.parsed.js

  const pkgRealFile = store.files[pkgFile]
  const version = (pkgRealFile && pkgRealFile.node.parsed.js.version) || ''

  let realMain = pkgParsed.main
  const fullMainPath = realMain ? join(pkgDir, realMain) : ''

  if (
    (fullMainPath && fullMainPath === path) ||
    fullMainPath === join(path, 'index.js') ||
    fullMainPath === join(path, 'index') ||
    fullMainPath === path + '.js'
  ) {
    path = pkgDir
  }

  if (
    path === pkgDir ||
    resolveFrom.silent(dirname(path), pkgParsed.name) === path
  ) {
    path = join(pkgDir, pkgParsed.module || pkgParsed.main || 'index.js')
  } else if (
    pkgParsed.module &&
    path === join(pkgDir, pkgParsed.main || 'index.js')
  ) {
    path = join(pkgDir, pkgParsed.module)
  }

  if (!isFile(path)) {
    const indexJs = join(path, 'index.js')
    path = (await fs.exists(indexJs)) ? indexJs : path + '.js'
  }

  let node = path
  let browser = await browserResolve(pkg, path, pkgDir)
  if (browser !== path) {
    browser = (await resolve(store, browser)).browser
  }

  const filePath = parseFilePath(pkgDir, path, pkgParsed, browser, node)

  if (
    store.paths[filePath] &&
    store.paths[filePath] !== path &&
    store.resolved[store.paths[filePath]]
  ) {
    const prevResolved = store.resolved[store.paths[filePath]]
    return prevResolved
  }

  store.paths[filePath] = path

  const isEqual = node === browser

  if (node.indexOf('index.js') !== -1) {
    const indexWeb = join(dirname(node), 'index.web.js')
    const exists = await fs.exists(join(dirname(node), 'index.web.js'))
    if (exists) {
      console.log('resolve for web', node, indexWeb)
      node = indexWeb
      if (isEqual) {
        browser = node
      }
    }
  }

  // if (!isEqual && browser.indexOf('index.js') !== 0) {
  // later this..
  // }

  const resolved = {
    browser,
    node,
    pkgDir,
    pkgFile,
    version,
    path,
    original,
    id: moduleId(relativePath(node, pkgDir), version),
    isEqual
  }

  return resolved
}

module.exports = async (store, path) => {
  if (path in store.resolved) {
    return store.resolved[path]
  } else {
    const resolved = await resolve(store, path)

    store.resolved[resolved.path] = resolved

    if (resolved.path !== resolved.original) {
      store.resolved[resolved.original] = store.resolved[resolved.path]
    }

    return resolved
  }
}
