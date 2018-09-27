const parse = require('./parse')
const { es2015 } = require('./ast')

const parseJs = (file, fromCache) => {
  file.type = 'js'

  if (file.node === file.browser) {
    file.browser = {}
  }

  try {
    if (file.resolved.isEqual) {
      file.node.parsed = parse(file, 'node', fromCache)
      if (!fromCache) {
        file.browser.parsed = Object.assign({}, file.node.parsed)
      }
      file.browser.dependencies = file.node.dependencies
    } else {
      file.node.parsed = parse(file, 'node', fromCache)
      file.browser.parsed = parse(file, 'browser', fromCache)
    }

    if (!fromCache) {
      file.browser.parsed.code = es2015(file.browser.parsed.code)
    }
  } catch (err) {
    console.log(err)
    file.error = new Error('Error parsing file')
  }
}

module.exports = parseJs
