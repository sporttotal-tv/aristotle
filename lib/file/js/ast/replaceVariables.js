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

  parse(path.scope)

  traverse(path.node, {
    Scope({ scope }) {
      parse(scope)
    }
  })
}
