const parse = require('./parse')
const { es2015 } = require('./ast')

const parseJs = (file, fromCache) => {
  file.type = 'js'

  if (file.node === file.browser) {
    file.browser = {}
  }

  try {
    // this is pretty dirty but an easy way to detect for an async component for now
    // beter to store it in the parsed file and then do a pass over it
    if (
      file.resolved.isEqual &&
      (!file.content ||
        !file.content.node ||
        !file.content.node.raw ||
        file.content.node.raw.indexOf('asyncComponent') === -1)
    ) {
      file.node.parsed = parse(file, 'node', fromCache)
      if (!fromCache) {
        file.browser.parsed = Object.assign({}, file.node.parsed)
      }
      file.browser.dependencies = file.node.dependencies.concat([])
    } else {
      file.node.parsed = parse(file, 'node', fromCache)
      file.browser.parsed = parse(file, 'browser', fromCache)
    }

    if (!fromCache) {
      file.browser.parsed.es2015 = es2015(file.browser.parsed.code)
    }

    if (file.node.parsed.error) {
      file.error = file.node.parsed.error
    } else if (file.browser.parsed.error) {
      file.error = file.browser.parsed.error
    }
  } catch (err) {
    // console.log(err)
    file.error = new Error('Error parsing AST of file')
  }
}

module.exports = parseJs
