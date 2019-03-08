const traverse = require('@babel/traverse').default

const isAncestor = (scope, check, key) => {
  var p = scope
  while (p) {
    if (check === p) {
      return true
    }

    if (p.hasOwnBinding(key)) {
      return false
    }

    p = p.parent
  }
}

module.exports = (key, replace, path) => {
  const parse = scope => {
    if (
      scope === path.scope ||
      (!scope.hasOwnBinding(key) && isAncestor(scope, path.scope, key))
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
