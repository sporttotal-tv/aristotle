const t = require('babel-types')
const babylon = require('babylon')
const template = require('babel-template')
const simpleStyle = require('./simple')
const animationStyle = require('./animation')
const pseudoStyle = require('./pseudo')

// eslint-disable-next-line
const expressionTemplate = template('`${ORIGINAL} ${NEW}`')
// eslint-disable-next-line
const stringTemplate = template('`ORIGINAL ${NEW}`')

const createDynamicStyleTemplate = (dynamicStyles, style) => {
  if (dynamicStyles.length === 1 && !style) {
    return babylon.parseExpression(dynamicStyles[0])
  } else {
    const s = dynamicStyles.map(val => '${' + val + '}')
    if (style) s.unshift(style)
    return babylon.parseExpression('`' + s.join(' ') + '`')
  }
}

const createClassNameNode = (path, dynamicStyles, style, result) => {
  let className
  // parent or sibling
  const elementPath = path.findParent(path => path.isJSXOpeningElement())
  elementPath.traverse({
    JSXAttribute(p) {
      if (p.node.name.name === 'className') {
        className = p
        p.stop()
      }
    }
  })
  if (className) {
    const isString = className.node.value.type === 'StringLiteral'
    if (isString && !dynamicStyles.length) {
      className.node.value.value += ' ' + style
    } else {
      const input = {
        ORIGINAL: isString
          ? className.node.value
          : className.node.value.expression,
        NEW: result
      }
      const templateResult = isString
        ? stringTemplate(input)
        : expressionTemplate(input)

      if (isString) {
        const val = className.node.value.value
        const quasis = templateResult.expression.quasis[0].value
        quasis.raw = quasis.raw.replace('ORIGINAL', val)
        quasis.cooked = quasis.cooked.replace('ORIGINAL', val)
      }
      className.replaceWith(
        t.JSXAttribute(
          t.JSXIdentifier('className'),
          t.JSXExpressionContainer(templateResult.expression)
        )
      )
    }
  } else {
    path.insertBefore(
      t.JSXAttribute(
        t.JSXIdentifier('className'),
        t.JSXExpressionContainer(result)
      )
    )
  }
}

const createClass = (componentStyles, dynamicStyles, path) => {
  let style = componentStyles.join(' ')
  let result
  if (dynamicStyles.length) {
    result = createDynamicStyleTemplate(dynamicStyles, style)
  } else if (style) {
    result = t.StringLiteral(style)
  }
  if (result) {
    createClassNameNode(path, dynamicStyles, style, result)
  }
}

const parseStyleObject = (expression, styles, dynamicStyles, path) => {
  const componentDynamicStyles = []
  const componentStyles = []
  const properties = expression.properties

  for (let i = 0; i < properties.length; i++) {
    const val = properties[i]
    if (val.type === 'ObjectProperty') {
      const len = properties.length
      if (
        animationStyle(
          val,
          componentStyles,
          styles,
          componentDynamicStyles,
          properties
        )
      ) {
        if (properties.length < len) {
          i = i - (len - properties.length)
        }
        properties.splice(i, 1)
        i--
      }
    }
  }

  for (let i = 0; i < properties.length; i++) {
    const val = properties[i]

    if (val.type === 'ObjectProperty') {
      const len = properties.length
      if (
        animationStyle(
          val,
          componentStyles,
          styles,
          componentDynamicStyles,
          properties
        ) ||
        simpleStyle(val, componentStyles, styles, properties) ||
        pseudoStyle(
          val,
          componentStyles,
          styles,
          componentDynamicStyles,
          properties
        )
      ) {
        if (properties.length < len) {
          i = i - (len - properties.length)
        }
        properties.splice(i, 1)
        i--
      }
    }
  }

  componentDynamicStyles.forEach(val => dynamicStyles.push(val))

  for (let i = 0; i < componentDynamicStyles.length; i++) {
    if (componentDynamicStyles[i] === 'animation') {
      componentDynamicStyles.splice(i, 1)
      i--
    }
  }

  createClass(componentStyles, componentDynamicStyles, path)

  if (properties.length === 0) {
    return true
  }
}

const parseExpression = (
  expression,
  styles,
  dynamicStyles,
  path,
  node,
  declaration
) => {
  if (expression.type === 'ObjectExpression') {
    if (parseStyleObject(expression, styles, dynamicStyles, path)) {
      if (!declaration) path.remove()
      return true
    }
  } else if (expression.type === 'CallExpression') {
    const callee = expression.callee
    if (
      callee.type === 'MemberExpression' &&
      callee.object.name === 'Object' &&
      callee.property.name === 'assign'
    ) {
      for (let i = 0; i < expression.arguments.length; i++) {
        if (expression.arguments[i].type === 'ObjectExpression') {
          if (
            parseStyleObject(
              expression.arguments[i],
              styles,
              dynamicStyles,
              path
            )
          ) {
            expression.arguments.splice(i, 1)
            i--
          }
        } else if (expression.arguments[i].type === 'Identifier') {
          if (
            parseIdentifier(
              expression.arguments[i],
              styles,
              dynamicStyles,
              path,
              node
            )
          ) {
            expression.arguments.splice(i, 1)
            i--
          }
        }
      }

      if (expression.arguments.length === 1) {
        if (declaration) {
          declaration.init = expression.arguments[0]
        } else {
          node.value = expression.arguments[0]
        }
      }

      if (expression.arguments.length === 0) {
        path.remove()
        return true
      }
    }
  }
}

const parseIdentifier = (expression, styles, dynamicStyles, path, node) => {
  if (expression.type === 'Identifier') {
    const name = expression.name
    const scopes = []

    path.findParent(node => {
      if (node.scope && !scopes.includes(node.scope)) {
        scopes.push(node.scope)
      }
    })

    for (let scope of scopes) {
      if (scope.hasOwnBinding(name)) {
        let found = false
        let removed = false
        scope.path.traverse({
          VariableDeclaration(p) {
            if (!found) {
              if (p.node.declarations.length) {
                for (let declaration of p.node.declarations) {
                  if (declaration.id && declaration.id.name === name) {
                    removed = parseExpression(
                      declaration.init,
                      styles,
                      dynamicStyles,
                      path,
                      node,
                      declaration
                    )
                    // we want this but need to check if its referenced anywhere else...
                    if (removed) {
                      declaration.init = void 0
                      if (
                        p.node.declarations.length === 1 &&
                        p.node.kind === 'const'
                      ) {
                        p.node.kind = 'var'
                      }
                    }
                    found = true
                    break
                  }
                }
              }
            }
          }
        })
        return removed
      }
    }
  }
}

const parseStyle = ({ styles, dynamicStyles }) => {
  // make this into a real plugin (will generate a seperate css file or something)
  return () => {
    return {
      visitor: {
        JSXAttribute(path) {
          const node = path.node
          if (node.name.name === 'style') {
            if (node.value && node.value.type === 'JSXExpressionContainer') {
              const expression = node.value.expression

              // include parsing of arrays! - exactly the same as object assign
              // re-write array to an object assign

              parseExpression(expression, styles, dynamicStyles, path, node)
              parseIdentifier(expression, styles, dynamicStyles, path, node)
            }
          }
        }
      }
    }
  }
}

module.exports = parseStyle
