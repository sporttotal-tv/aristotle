const ParsedFile = require('../parsed')

const parse = (raw, id) => {
  const result = new ParsedFile(id)
  result.exportStats.cjs = true
  result.js = JSON.parse(raw)
  result.code = `var ${id} = ${raw}`

  return result
}

const parseJson = file => {
  const id = file.id
  file.type = 'json'
  try {
    if (file.resolved.isEqual) {
      file.node = file.browser = { parsed: parse(file.content.node.raw, id) }
    } else {
      file.node = { parsed: parse(file.content.node.raw, id) }
      file.browser = { parsed: parse(file.content.browser.raw, id) }
    }
    file.node.dependencies = file.browser.dependencies = []
  } catch (err) {
    file.error = new Error('Error parsing JSON')
  }
}

module.exports = parseJson
