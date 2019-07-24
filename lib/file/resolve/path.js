const path = require('path')
const hash = require('string-hash')

const parseFilePath = (pkgPath, p, pkg) => {
  // need to find main etc
  if (!pkg.name) {
    throw new Error(`Cannot find pkg name ${pkgPath}`)
  }
  // add main here makes it nice
  return path.join(pkg.name, p.replace(pkgPath, ''))
}

const idMap = {}
const pathMap = {}

const isId = (key, m = idMap) => {
  return key.indexOf('$') === 0 && m[key.split('_')[0]]
}

const moduleId = (p, version) => {
  var id = pathMap[p]
  if (!id) {
    id = `$${hash(p + version).toString(36)}`
    pathMap[p] = id
    idMap[pathMap[p]] = p
  }
  return id
}

const relativePath = (p, dir) => {
  return p.replace(path.dirname(dir), '')
}

exports.idMap = idMap
exports.isId = isId
exports.moduleId = moduleId
exports.parseFilePath = parseFilePath
exports.relativePath = relativePath
