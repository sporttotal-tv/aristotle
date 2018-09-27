const { parseCode } = require('./ast')
const builtinModules = require('builtin-modules')
const resolveFrom = require('resolve-from')
const { dirname, join, resolve } = require('path')

const alias = (file, module) => {
  const { pkgDir } = file.resolved
  const pkg = file.pkg
  if (pkg.alias) {
    for (let key in pkg.alias) {
      if (module === key || module.indexOf(key) === 0) {
        return module.replace(key, resolve(pkgDir, pkg.alias[key]))
      }
    }
  }
}

const resolveDependency = (file, val, moduleType, type) => {
  const path = file.resolved[type]
  val.type = moduleType
  val.parseDependencies = { node: true, browser: true }
  if (moduleType === 'static') {
    if (/(\.css|\.js)$/.test(val.module)) {
      val.path = join(__dirname, '../static', val.module)
    } else {
      val.path = join(__dirname, '../static', val.module, 'index.js')
    }
  } else if (builtinModules.includes(val.module)) {
    val.parseDependencies = { node: false, browser: true }
    val.path = join(__dirname, '../builtin', val.module, 'index.js')
  } else if (!/^\./.test(val.module)) {
    val.path =
      alias(file, val.module) || resolveFrom.silent(dirname(path), val.module)
  } else {
    val.path = resolveFrom.silent(dirname(path), val.module)
  }

  if (!val.path) {
    val.restoreModule = true
  }
}

const parsePaths = (file, arr, moduleType, type) => {
  for (let val of arr) {
    resolveDependency(file, val, moduleType, type)
  }
}

const parse = (file, type, fromCache) => {
  const dontParseRequires =
    type === 'node' &&
    dirname(dirname(file.path)) === join(__dirname, '../builtin')
  const raw = fromCache ? '' : file.content[type].raw
  const ast = fromCache
    ? file[type].parsed
    : parseCode(file, raw, dontParseRequires, type)
  const { imports, requires, dynamicImports, includeStatic } = ast

  parsePaths(file, imports, 'import', type)
  parsePaths(file, requires, 'require', type)
  parsePaths(file, dynamicImports, 'dynamic', type)
  parsePaths(file, includeStatic, 'static', type)

  file[type].dependencies = imports
    .concat(requires)
    .concat(dynamicImports)
    .concat(includeStatic)

  return ast
}

module.exports = parse
