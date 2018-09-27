// need to add css - modules / class parsing
// including external css modules

const ParsedFile = require('../parsed')

const parse = (raw, id) => {
  const result = new ParsedFile(id)
  result.exportStats.module = true
  result.css = raw
  result.code = `var ${id} = {};`
  return result
}

const parseCss = file => {
  file.type = 'css'
  const id = file.id
  if (file.resolved.isEqual) {
    file.node = file.browser = { parsed: parse(file.content.node.raw, id) }
  } else {
    file.node = { parsed: parse(file.content.node.raw, id) }
    file.browser = { parsed: parse(file.content.browser.raw, id) }
  }
  file.node.dependencies = file.browser.dependencies = []
}

module.exports = parseCss
