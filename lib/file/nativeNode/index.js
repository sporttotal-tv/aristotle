const ParsedFile = require('../parsed')

const parse = (raw, id) => {
  const result = new ParsedFile(id)

  result.js = `console.log("lullz ${id} ${raw}");`

  //   const parsed = gql(raw)
  //   parsed.input = raw
  //   result.exportStats.cjs = true
  //   result.js = parsed
  //   result.code = `var ${id} = ${JSON.stringify(parsed)}`
  //   return result
}

const parseNativeNode = file => {
  const id = file.id
  file.type = 'nativeNode'

  console.log('nativeNode', file.path)

  try {
    file.node = { parsed: parse('??', id) }

    const browser = new ParsedFile(id)
    browser.js = browser.code = `console.error("cannot run native node in the browser ${
      file.path
    }")`

    file.browser = { parsed: browser }

    // file.browser = {} -- make fallback or error at least

    file.node.dependencies = file.browser.dependencies = []
  } catch (err) {
    console.error(err)
    file.error = err
    // const line = err.locations
    //   ? ` (${err.locations[0].line}:${err.locations[0].column})`
    //   : ''
    // file.error = new Error('GQL error ' + err.message + line)
  }
}

module.exports = parseNativeNode
