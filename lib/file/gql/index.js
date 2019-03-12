const ParsedFile = require('../parsed')
const gql = require('graphql-tag')

const parse = (raw, id) => {
  const result = new ParsedFile(id)

  const parsed = gql(raw)
  parsed.input = raw

  result.exportStats.cjs = true
  result.js = parsed
  result.code = `var ${id} = ${JSON.stringify(parsed)}`
  return result
}

const parseGql = file => {
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

module.exports = parseGql
