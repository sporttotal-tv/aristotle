const { dash, genClass } = require('./util')

const simpleStyle = (
  val,
  componentStyles,
  styles,
  properties,
  fromAnimation
) => {
  // console.log(val.value)
  if (
    val.value.type === 'NumericLiteral' ||
    val.value.type === 'StringLiteral' ||
    (val.value.type === 'UnaryExpression' && val.value.operator === '-')
  ) {
    const property =
      val.key.type === 'Identifier' ? val.key.name : val.key.value

    if (
      !fromAnimation &&
      (property === 'animation' || property === 'animationName') &&
      properties.find(val => val.key.value === '@keyframes')
    ) {
      return
    }

    const value =
      val.value.type === 'UnaryExpression'
        ? `-${val.value.argument.value}`
        : val.value.value
    const hashed = genClass(property, value)
    const css = `.${hashed} { ${dash(property)}: ${value};}`
    styles.push({
      property,
      val: value,
      hash: hashed,
      css
    })
    componentStyles.push(hashed)
    return true
  }
}

module.exports = simpleStyle
