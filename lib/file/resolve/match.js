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

const isGql = str => {
  return /\.gql$/.test(str)
}

const isPkg = str => {
  return /package\.json$/.test(str)
}

const isFile = str => {
  return /(\.js|\.JS|\.jsx|\.JSX|\.json|\.JSON|\.css|\.CSS|\.gql)$/.test(str)
}

exports.isCss = isCss
exports.isJs = isJs
exports.isDir = isDir
exports.isJson = isJson
exports.isPkg = isPkg
exports.isFile = isFile
exports.isGql = isGql
