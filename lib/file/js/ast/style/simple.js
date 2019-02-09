const { dash, genClass } = require('./util')
const generate = require('babel-generator').default
const traverse = require('babel-traverse').default
const babylon = require('babylon')

const parseValue = (
  property,
  value,
  fromAnimation,
  properties,
  styles,
  path
) => {
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

    // console.log(v)
    const hashed = genClass(property, v)
    const css = `.${hashed} { ${dash(property)}: ${v};}`
    const style = {
      property,
      val: v,
      hash: hashed,
      css
    }

    styles.push(style)

    return [hashed]
  } else {
    if (value.type === 'ConditionalExpression') {
      const consequent = value.consequent
      const alternate = value.alternate

      // console.log(consequent)
      let [hashed1] = parseValue(
        property,
        consequent,
        fromAnimation,
        properties,
        styles,
        path
      )
      let [hashed2] = parseValue(
        property,
        alternate,
        fromAnimation,
        properties,
        styles,
        path
      )
      if (hashed1 && hashed2) {
        if (typeof hashed1 !== 'object') {
          // console.log(hashed1)
          consequent.type = 'StringLiteral'
          consequent.value = hashed1
        }
        if (typeof hashed2 !== 'object') {
          // console.log(hashed2)
          alternate.type = 'StringLiteral'
          alternate.value = hashed2
        }
        // console.log('============', generate(value).code)
        // if code && object need to do more
        return [{ code: generate(value).code }]
      } else {
        if (hashed1 || hashed2) {
          styles.pop()
        }
      }
    } else {
      if (value.type === 'Identifier') {
        // console.log('OK VALUE', path)
        // ArrowFunctionExpression
        // FunctionDeclaration
        const name = value.name
        if (name) {
          const x = path.findParent(
            p =>
              p.node.type === 'FunctionDeclaration' ||
              p.node.type === 'ArrowFunctionExpression'
          )
          var found
          if (x) {
            traverse(
              x.node,
              {
                VariableDeclaration(p) {
                  const c =
                    p.node.declarations && p.node.declarations[0].id.name
                  if (c === name) {
                    // console.log('------------->', c, name)
                    // console.log(p.node.declarations[0].init)
                    let [hashed] = parseValue(
                      property,
                      p.node.declarations[0].init,
                      fromAnimation,
                      properties,
                      styles,
                      path
                    )
                    if (hashed) {
                      // console.log('remove the variable', hashed)
                      // console.log('???')
                      p.node.declarations[0].init = babylon.parseExpression(
                        hashed.code || hashed
                      )
                      // console.log('snurf')
                      found = true
                    }
                  }
                }
              },
              x.scope
            )
            if (found) {
              return [{ code: name }]
            }
          }
        }
      }
      // identifier / parse if string literal of conditional
    }
  }
  return []
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
  const [hashed] = parseValue(
    property,
    val.value,
    fromAnimation,
    properties,
    styles,
    path
  )
  if (hashed) {
    componentStyles.push(hashed)
    return true
  }
}

module.exports = simpleStyle
