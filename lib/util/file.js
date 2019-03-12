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
