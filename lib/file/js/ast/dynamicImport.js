const { rewriteModule } = require('./rewrite')
const t = require('@babel/types')

const parseDynamicImports = ({ dynamicImports, exportStats, id }) => {
  return {
    CallExpression(path) {
      const node = path.node
      if (
        node &&
        node.callee &&
        ((node.callee.type === 'Identifier' &&
          node.callee.name === 'imports' &&
          node.arguments &&
          node.arguments.length === 1) ||
          node.callee.type === 'Import')
      ) {
        if (node.arguments[0].type === 'StringLiteral') {
          const moduleName = node.arguments[0].value
          const replace = rewriteModule(moduleName)
          const dynamicImport = {
            module: moduleName,
            members: [],
            replace
          }
          dynamicImports.push(dynamicImport)
          dynamicImport.default = true
          node.arguments[0] = t.stringLiteral(rewriteModule(moduleName))
        } else {
          console.log(
            '! variable imports() are not supported',
            node.arguments[0]
          )
        }
        node.callee = { type: 'Identifier', name: 'imports' }
      }
    }
  }
}

module.exports = parseDynamicImports
