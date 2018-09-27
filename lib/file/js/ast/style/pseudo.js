const { collectProperties } = require('./dynamic')
const { pushStyle } = require('./util')
const hash = require('string-hash')

const pseudoStyle = (
  val,
  componentStyles,
  styles,
  dynamicStyles,
  properties,
  fromAnimation
) => {
  var isMedia, isFontFace
  if (
    val.key.type === 'StringLiteral' &&
    (val.key.value[0] === ':' ||
      (isMedia = /^@media/.test(val.key.value)) ||
      (isFontFace = val.key.value === '@font-face')) &&
    val.value.type === 'ObjectExpression'
  ) {
    const property = val.key.value
    let value = []
    collectProperties(
      val,
      value,
      property,
      dynamicStyles,
      properties,
      fromAnimation
    )
    if (isFontFace) {
      const css = `${property} {${value.join('')}}`
      styles.push({
        property,
        val: value,
        hash: hash(css),
        css
      })
    } else {
      const hashed = 'style_' + hash(property + value).toString(36)
      const css = isMedia
        ? `${property} {.${hashed} {${value.join('')}} }`
        : property === ':hover'
          ? `@media (hover: hover) { .${hashed}${property} {${value.join(
              ''
            )}} }`
          : `.${hashed}${property} {${value.join('')}}`
      pushStyle(value, css, hashed, property, componentStyles, styles)
    }
    return true
  } else if (
    val.key.type === 'StringLiteral' &&
    (val.key.value[0] === ':' ||
      (isMedia = /^@media/.test(val.key.value)) ||
      (isFontFace = val.key.value === '@font-face')) &&
    val.value.type === 'ArrayExpression'
  ) {
    val.value.elements.forEach(element => {
      pseudoStyle(
        {
          key: val.key,
          value: element
        },
        componentStyles,
        styles,
        dynamicStyles,
        properties,
        fromAnimation
      )
    })
    return true
  }
}

module.exports = pseudoStyle
