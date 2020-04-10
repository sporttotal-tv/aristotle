const replaceVariables = require('./replaceVariables')
const { isId } = require('../../resolve/path')
const babylon = require('@babel/parser')
const babylonOptions = require('./options')

// some nice webpack specific compile results
const webpackInterop = ({ exportStats, id, idMap }) => {
  return props => {
    const remove = []
    return {
      visitor: {
        Program(path) {
          this.program = path
        },
        Identifier(path) {
          if (path.node.name === '__esModule') {
            if (exportStats.moduleExports.indexOf('__esModule') === -1) {
              exportStats.moduleExports.push('__esModule')
            }
          }
        },
        AssignmentExpression(path) {
          if (path.node.right.name === '_interopRequireDefault') {
            console.log('dont remove interop')
            this.dontRemoveInterop = true
          }
        },
        FunctionDeclaration(path) {
          const node = path.node
          if (node.id && node.id.name === '_interopRequireDefault') {
            if (exportStats.moduleExports.indexOf('__esModule') === -1) {
              exportStats.moduleExports.push('__esModule')
            }

            // mark for removal
            if (!this.markedAsInterop) {
              this.markedAsInterop = []
            }
            this.markedAsInterop.push(path)
          }
        },
        CallExpression(path) {
          const node = path.node
          if (
            node.callee &&
            node.callee.type === 'Identifier' &&
            (node.callee.name === 'interopRequireDefault' ||
              node.callee.name === '_interopRequireDefault')
          ) {
            if (exportStats.moduleExports.indexOf('__esModule') === -1) {
              exportStats.moduleExports.push('__esModule')
            }

            path.replaceWith(node.arguments[0])
          }
        },
        MemberExpression(path) {
          const node = path.node

          if (
            node.property.name === 'defineProperty' &&
            node.object.name === 'Object'
          ) {
            try {
              const parent = path.findParent(
                p => p && p.node && p.node.type === 'CallExpression'
              )
              if (parent) {
                const a = parent.node.arguments
                if (
                  a &&
                  a[0].name === 'exports' &&
                  a[1] &&
                  a[1].value === '__esModule'
                ) {
                  remove.push(parent)
                  if (exportStats.moduleExports.indexOf('__esModule') === -1) {
                    exportStats.moduleExports.push('__esModule')
                  }
                }
              }
            } catch (err) {
              console.log('error parsing __esModule', err)
            }
          } else if (
            (node.property.name === 'default' ||
              node.property.value === 'default') &&
            !node.parsed &&
            node.object.type === 'Identifier' &&
            path.parent &&
            path.parent.type !== 'AssignmentExpression' &&
            !path.findParent(p => p.node && p.node.parsed)
          ) {
            if (
              exportStats.moduleExports.indexOf('__esModule') !== -1 ||
              exportStats.__esModule ||
              node.object.name.indexOf('MODULE_') === 0
              // path.scope === this.program.scope // hopefully we can rtemove this one
            ) {
              try {
                const block = babylon.parse(
                  `((${node.object.name}.default !== void 0 && ${node.object.name}.default) || ${node.object.name})`,
                  babylonOptions
                )
                block.program.body[0].expression.left.parsed = true
                block.program.body[0].parsed = true
                path.replaceWith(block.program.body[0])
                path.node.parsed = true
              } catch (e) {
                console.log('cannot create default block')
              }
            }
          }
        }
      },

      post() {
        if (this.markedAsInterop) {
          if (!this.dontRemoveInterop) {
            this.markedAsInterop.forEach(path => {
              path.remove()
            })
          }
        }

        const path = this.program
        for (const key in path.scope.bindings) {
          if (path.scope.hasOwnBinding(key)) {
            if (!isId(key, idMap)) {
              replaceVariables(key, `_${id}_${key}`, path)
            }
          }
        }
        remove.forEach(p => p.remove())
      }
    }
  }
}

module.exports = webpackInterop
