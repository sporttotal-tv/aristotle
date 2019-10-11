const { parseCode } = require('./ast')
const builtinModules = require('builtin-modules')
const resolveFrom = require('resolve-from')
const { dirname, join, resolve } = require('path')
const { normalizePath } = require('../../util/file')
const { idMap } = require('../resolve/path')

const parseArgs = file => {
  return {
    id: file.id,
    resolved: file.resolved,
    path: file.path,
    idMap
  }
}

const alias = (file, module, path) => {
  const { pkgDir } = file.resolved
  const pkg = file.pkg

  let result
  if (pkg.alias) {
    for (const key in pkg.alias) {
      if (module === key || module.indexOf(key) === 0) {
        if (
          !result ||
          (module !== result.key &&
            (result.key.length < key.length || module === key))
        ) {
          result = {
            key,
            resolved:
              pkg.alias[key][0] !== '.'
                ? resolveFrom.silent(dirname(path), pkg.alias[key])
                : module.replace(key, resolve(pkgDir, pkg.alias[key]))
          }
        }
      }
    }
  }
  return result ? result.resolved : undefined
}

const resolveDependency = (file, val, moduleType, type) => {
  const path = file.resolved[type]
  val.type = moduleType
  val.parseDependencies = { node: true, browser: true }
  if (moduleType === 'static') {
    val.path = join(__dirname, '../static', val.module)
  } else if (builtinModules.includes(val.module)) {
    val.parseDependencies = { node: false, browser: true }
    val.path = join(__dirname, '../builtin', val.module)
  } else if (!/^\./.test(val.module)) {
    val.path =
      alias(file, val.module, path) ||
      resolveFrom.silent(dirname(path), val.module)
  } else {
    val.path = resolveFrom.silent(dirname(path), val.module)
  }

  if (!val.path) {
    val.restoreModule = true
  } else {
    val.path = normalizePath(val.path)
  }
}

const parsePaths = (file, arr, moduleType, type) => {
  for (const val of arr) {
    resolveDependency(file, val, moduleType, type)
  }
}

const parse = async (file, type, fromCache) => {
  const dontParseRequires =
    type === 'node' && dirname(file.path) === join(__dirname, '../builtin')
  const raw = fromCache ? '' : file.content[type].raw

  const ast = fromCache
    ? file[type].parsed
    : await parseCode(parseArgs(file), raw, dontParseRequires, type, file.store)
  const { imports, requires, dynamicImports, includeStatic, nodeModules } = ast

  parsePaths(file, imports, 'import', type)
  parsePaths(file, requires, 'require', type)
  parsePaths(file, dynamicImports, 'dynamic', type)
  parsePaths(file, includeStatic, 'static', type)

  file[type].dependencies = imports
    .concat(requires)
    .concat(dynamicImports)
    .concat(includeStatic)

  if (nodeModules.length) {
    nodeModules.forEach(module => {
      if (
        file.store.nodeModules &&
        file.store.nodeModules.indexOf(module) === -1
      ) {
        file.store.nodeModules.push(module)
      }
    })
  }

  return ast
}

module.exports = parse
parse.parsePaths = parsePaths
