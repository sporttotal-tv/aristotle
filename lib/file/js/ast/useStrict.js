module.exports = props => {
  return {
    visitor: {
      Directive(path) {
        const node = path.node
        if (
          node.value &&
          node.value.type === 'DirectiveLiteral' &&
          node.value.value === 'use strict'
        ) {
          // remove all use strict declarations (smaller size)
          path.remove()
        }
      }
    }
  }
}
