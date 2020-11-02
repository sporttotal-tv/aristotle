module.exports = ({ env }) => {
  return function({ types: t }) {
    function isLeftSideOfAssignmentExpression(path) {
      return (
        t.isAssignmentExpression(path.parent) && path.parent.left === path.node
      )
    }
    return {
      name: 'transform-inline-environment-variables',
      visitor: {
        MemberExpression(path, { opts: { include, exclude } = {} }) {
          if (path.get('object').matchesPattern('process.env')) {
            const key = path.toComputedKey()
            if (
              t.isStringLiteral(key) &&
              !isLeftSideOfAssignmentExpression(path) &&
              (!include || include.indexOf(key.value) !== -1) &&
              (!exclude || exclude.indexOf(key.value) === -1)
            ) {
              env.push(key.value)
              //   path.replaceWith(t.valueToNode(process.env[key.value]))
            }
          }
        }
      }
    }
  }
}