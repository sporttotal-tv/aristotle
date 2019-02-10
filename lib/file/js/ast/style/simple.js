const { dash, genClass } = require('./util')
const generate = require('babel-generator').default
const traverse = require('babel-traverse').default
const babylon = require('babylon')

const parseIdentifier = (
  property,
  value,
  fromAnimation,
  properties,
  styles,
  path
) => {
  const name = value.name
  if (name) {
    const fn = path.findParent(
      p =>
        p.node.type === 'FunctionDeclaration' ||
        p.node.type === 'ArrowFunctionExpression'
    )
    let found

    if (fn) {
      traverse(
        fn.node,
        {
          VariableDeclaration(p) {
            const c = p.node.declarations && p.node.declarations[0].id.name
            if (c === name) {
              found = p
              p.stop()
            }
          }
        },
        fn.scope
      )
      if (found) {
        // need to check if its used anywhere else then in style as a binding
        const declaration =
          found.node.declarations && found.node.declarations[0]

        // make a copy of node

        const result = parseValue(
          property,
          JSON.parse(JSON.stringify(declaration.init)),
          fromAnimation,
          properties,
          styles,
          path
        )
        if (result) {
          // console.log('YES PARSE ID', property, name, result)
          const code = result.code || '"' + result + '"'
          return { code }
        }
      }
    }
  }
}

const parseCondition = (
  property,
  value,
  fromAnimation,
  properties,
  styles,
  path
) => {
  const consequent = value.consequent
  const alternate = value.alternate
  let consequentResult = parseValue(
    property,
    consequent,
    fromAnimation,
    properties,
    styles,
    path
  )
  let alternateResult = parseValue(
    property,
    alternate,
    fromAnimation,
    properties,
    styles,
    path
  )
  if (consequentResult && alternateResult) {
    if (typeof consequentResult !== 'object') {
      consequent.type = 'StringLiteral'
      consequent.value = consequentResult
    }
    if (typeof alternateResult !== 'object') {
      alternate.type = 'StringLiteral'
      alternate.value = alternateResult
    }
    return { code: generate(value).code }
  }
}

const parseValue = (
  property,
  value,
  fromAnimation,
  properties,
  styles,
  path
) => {
  if (!value) {
    return
  }
  if (
    value.type === 'NumericLiteral' ||
    value.type === 'StringLiteral' ||
    (value.type === 'UnaryExpression' && value.operator === '-')
  ) {
    if (
      !fromAnimation &&
      (property === 'animation' || property === 'animationName') &&
      properties.find(val => val.key.value === '@keyframes')
    ) {
      return
    }
    const v =
      value.type === 'UnaryExpression'
        ? `-${value.argument.value}`
        : value.value
    const hashed = genClass(property, v)
    const css = `.${hashed} { ${dash(property)}: ${v};}`
    const style = {
      property,
      val: v,
      hash: hashed,
      css
    }
    styles.push(style)
    return hashed
  } else if (value.type === 'ConditionalExpression') {
    // identifier / parse if string literal of conditional
    return parseCondition(
      property,
      value,
      fromAnimation,
      properties,
      styles,
      path
    )
  } else if (value.type === 'Identifier') {
    return parseIdentifier(
      property,
      value,
      fromAnimation,
      properties,
      styles,
      path
    )
  }
}

const simpleStyle = (
  val,
  componentStyles,
  styles,
  properties,
  fromAnimation,
  path
) => {
  const property = val.key.type === 'Identifier' ? val.key.name : val.key.value
  const stylesResult = []

  const result = parseValue(
    property,
    val.value,
    fromAnimation,
    properties,
    stylesResult,
    path
  )
  if (result) {
    styles.push(...stylesResult)
    componentStyles.push(result)
    return true
  }
}

module.exports = simpleStyle
