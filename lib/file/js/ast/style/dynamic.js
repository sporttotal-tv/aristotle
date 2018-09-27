const generate = require('babel-generator').default
const { dash } = require('./util')

const addDynamic = (dynamic, property) => {
  var value = ''
  for (let key in dynamic) {
    value += `${key}:$\{${dynamic[key]}} !important;`
  }
  return `__dynC(\`${value}\`,'${property}')`
}

const collectProperties = (val, value, property, dynamicStyles, properties) => {
  const dynamic = {}
  var hasDynamic = false

  for (let i = 0; i < val.value.properties.length; i++) {
    const select = val.value.properties[i]
    const name = select.key.name || select.key.value

    if (
      select.value.type === 'NumericLiteral' ||
      select.value.type === 'StringLiteral'
    ) {
      if (property === '@font-face') {
        value.push(`${dash(name)}:${select.value.value};`)
      } else {
        value.push(`${dash(name)}:${select.value.value} !important;`)
      }
    } else {
      hasDynamic = true
      dynamic[dash(name)] = generate(select.value).code
    }
  }

  if (hasDynamic) {
    dynamicStyles.push(addDynamic(dynamic, property))
  }
}

exports.addDynamic = addDynamic
exports.collectProperties = collectProperties
