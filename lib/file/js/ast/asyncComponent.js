const template = require('babel-template')
const defaultComponent = template(`require(module)`)

const asyncComponent = () => {
  return () => {
    return {
      visitor: {
        JSXAttribute(path) {
          const node = path.node
          if (node.name.name === 'asyncComponent') {
            if (node.value && node.value.type === 'JSXExpressionContainer') {
              const expression = node.value.expression
              if (
                expression.body &&
                expression.async &&
                expression.body.type === 'CallExpression' &&
                expression.body.callee.type === 'Import' &&
                expression.body.arguments[0] &&
                expression.body.arguments[0].type === 'StringLiteral'
              ) {
                const tmp = defaultComponent({
                  module: expression.body.arguments[0]
                })
                node.value.expression = tmp.expression
                node.name.name = 'component'
              }
            }
          }
        }
      }
    }
  }
}

module.exports = asyncComponent
