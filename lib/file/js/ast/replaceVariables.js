const traverse = require('babel-traverse').default
const isAncestor = require('./isAncestor')

module.exports = (key, replace, path) => {
  const parse = scope => {
    if (
      scope === path.scope ||
      (!scope.hasOwnBinding(key) && isAncestor(scope, path.scope))
    ) {
      scope.rename(key, replace)
    }
  }

  if (replace === '$180k8w0_virtual') {
    console.log('ok here we go do it', key)
  }

  parse(path.scope)

  traverse(path.node, {
    Scope({ scope }) {
      parse(scope)
    }
  })
}
