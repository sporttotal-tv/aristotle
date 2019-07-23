const ParsedFile = require('../parsed')

const parseNativeNode = file => {
  const id = file.id
  //   file.type = 'js'
  // file.type = 'js'
  //   console.log('nativeNode', file.node)

  try {
    const browser = new ParsedFile(id)
    browser.code = `console.error("cannot run native node modules in the browser ${
      file.path
    }")`
    file.browser = { parsed: browser }

    const node = new ParsedFile(id)
    node.code = `console.log('NATIVE TIMES);`
    console.log(node)
    file.hasNative = true
    file.node = { parsed: node }
    file.node.dependencies = file.browser.dependencies = []
  } catch (err) {
    console.error(err)
    file.error = err
  }
}

module.exports = parseNativeNode
