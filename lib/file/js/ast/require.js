const t = require('babel-types')
const { rewriteModule } = require('./rewrite')
const template = require('babel-template')
const emptyVar = template(`var NAME = {}; // ok maybe double`)
const callBlock = template(`
  var NAME = FN();
  // do it correct!
`)

const varDef = template(`
  var NAME = VAR;
  // do it correct!
`)

// const babylon = require('babylon')
// const babylonOptions = require('./options')

const insert = (id, path) => {
  // gaurd for double variables
  const parent = path.findParent(path => path.isProgram())
  if (
    !parent.node.body.find(
      val =>
        val.type === 'VariableDeclaration' &&
        val.declarations[0] &&
        val.declarations[0].id.name === id
    )
  ) {
    parent.node.body.unshift(emptyVar({ NAME: t.identifier(id) }))
  }
}

const hasBinding = (path, key) => {
  var p = path
  while (p) {
    if (p.scope.hasOwnBinding(key)) {
      return true
    } else {
      p = p.parentPath
    }
  }
}

/*
Object.defineProperty(module, 'exports', {}) 
*/

const parseRequires = ({ requires, exportStats, id, dontParseRequires }) => {
  // if (id === '$180k8w0') {
  //   console.log('require times')
  // }

  return {
    CallExpression(path) {
      const node = path.node
      if (
        !dontParseRequires &&
        node &&
        node.callee &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments &&
        node.arguments.length === 1
      ) {
        exportStats.isCJS = true
        if (node.arguments[0].type === 'StringLiteral') {
          const moduleName = node.arguments[0].value
          const replace = rewriteModule(moduleName)
          const requirer = {
            module: moduleName,
            members: [],
            replace
          }
          requires.push(requirer)
          requirer.default = true

          if (
            path.parentPath.node.type === 'ExpressionStatement' &&
            path.parentPath.parentPath.node.type === 'Program'
          ) {
            path.remove()
          } else {
            path.replaceWith(t.identifier(rewriteModule(moduleName)))
          }

          // if (isAssignment) {
          // } else {
          //   path.remove()
          // }
        } else {
          // console.log(
          //   '$ dynamic requires are not supported in the browser',
          //   node.arguments[0],
          //   id
          // )
        }
      }
    },
    Identifier(path) {
      const node = path.node
      if (
        node.name === 'exports' &&
        !hasBinding(path, 'exports') &&
        !(
          path.parent &&
          path.parent.type === 'MemberExpression' &&
          path.parent.object === node
        )
      ) {
        exportStats.referenceToModule = true
        path.replaceWith(t.identifier(id))
      }
    },
    MemberExpression(path) {
      const node = path.node

      if (
        node.property.name === 'defineProperty' &&
        node.object.name === 'Object'
      ) {
        const parent = path.findParent(p => {
          return p.node.type === 'CallExpression'
        })

        if (parent) {
          const a = parent.node.arguments

          // if on exports!

          if (a && a[0].name === 'module' && a[1] && a[1].value === 'exports') {
            const value = a[2]
            if (value.type === 'ObjectExpression') {
              let block
              value.properties.forEach(val => {
                if (val.key.name === 'get') {
                  block = callBlock({
                    NAME: t.identifier(id),
                    FN: val.value
                  })
                } else if (val.key.name === 'value') {
                  block = varDef({
                    NAME: t.identifier(id),
                    VAR: val.value
                  })
                }
              })

              if (block) {
                parent.parentPath.replaceWith(block)
              }
            }
          } else if (
            a[0].name === 'exports' &&
            typeof a[1].value === 'string' &&
            a[1].value !== '__esModule'
          ) {
            const value = a[2]
            const field = a[1]

            if (value.type === 'ObjectExpression') {
              let block
              value.properties.forEach(val => {
                if (val.key.name === 'get') {
                  block = callBlock({
                    NAME: t.identifier(`${id}_${field.value}`),
                    FN: val.value
                  })
                } else if (val.key.name === 'value') {
                  block = varDef({
                    NAME: t.identifier(`${id}_${field.value}`),
                    VAR: val.value
                  })
                }
              })

              if (block) {
                if (!exportStats.moduleExports.includes(field.value)) {
                  exportStats.moduleExports.push(field.value)
                }
                parent.parentPath.replaceWith(block)
              }
            }
          }
        }
      } else if (
        node.object.name === 'exports' &&
        !hasBinding(path, 'exports')
      ) {
        const isAssignment = path.findParent(path =>
          path.isAssignmentExpression()
        )
        const isMember = path.findParent(path => path.isMemberExpression())
        const propName = node.property.name || node.property.value

        if (
          isAssignment &&
          isAssignment.node.left.object &&
          isAssignment.node.left.object.name === 'exports'
        ) {
          if (isAssignment.node.left.computed) {
            isAssignment.node.left.object.name = id
          } else if (!isMember) {
            insert(`${id}_${propName}`, path)
            if (!exportStats.moduleExports.includes(propName)) {
              exportStats.moduleExports.push(propName)
            }
            isAssignment.node.left = t.identifier(`${id}_${propName}`)
          } else {
            insert(`${id}_${propName}`, path)
            path.replaceWith(t.identifier(`${id}_${propName}`))
          }
        } else {
          if (Object[propName]) {
            path.replaceWith(t.identifier(`${id}.${propName}`))
          } else {
            insert(`${id}_${propName}`, path)
            path.replaceWith(t.identifier(`${id}_${propName}`))
          }
        }
      } else if (
        node.object.name === 'module' &&
        node.property.name === 'exports' &&
        !path.scope.hasOwnBinding('module')
      ) {
        const parent = path.findParent(path => path.isAssignmentExpression())
        if (parent) {
          exportStats.module = true
          path.replaceWith(t.identifier(id))
          insert(id, path)
        } else {
          exportStats.referenceToModule = true
          path.replaceWith(t.identifier(id))
        }
      }
    }
  }
}

module.exports = parseRequires
