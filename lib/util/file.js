const isJs = str => {
  return /\.js$/.test(str)
}

const isCss = str => {
  return /\.css$/.test(str)
}

const isDir = str => {
  return !/\.[a-z]{1,10}$/.test(str)
}

const isJson = str => {
  return /\.json$/.test(str)
}

const isPkg = str => {
  return /package\.json$/.test(str)
}

const indexRe = /\/index\.js$/
const jsRe = /\.js$/

const normalizePath = str => {
  if (indexRe.test(str)) {
    return str.replace(indexRe, '')
  } else if (jsRe.test(str)) {
    return str.replace(jsRe, '')
  } else {
    return str
  }
}

exports.normalizePath = normalizePath
exports.isJs = isJs
exports.isDir = isDir
exports.isJson = isJson
exports.isPkg = isPkg
exports.isCss = isCss
