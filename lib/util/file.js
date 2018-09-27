const isJs = str => {
  return /\.js$/.test(str)
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

exports.isJs = isJs
exports.isDir = isDir
exports.isJson = isJson
exports.isPkg = isPkg

