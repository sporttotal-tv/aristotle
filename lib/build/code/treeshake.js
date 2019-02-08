const babylon = require('babylon')
const babel = require('babel-core')
const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
// const deadCode = require('babel-plugin-remove-dead-code').default
const deadCode = require('babel-plugin-remove-dead-code').default
const traverse = require('babel-traverse').default

module.exports = (raw, id, options) => {
  if (options.all) {
    return raw
  }

  var ast = babylon.parse(raw, {
    plugins: [
      'jsx',
      'flow',
      'doExpressions',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'asyncGenerators',
      'functionBind',
      'functionSent',
      'templateInvalidEscapes',
      'dynamicImport'
    ]
  })

  //   console.log(options)

  // ExportDefaultDeclaration
  // ExportNamedDeclaration

  let list = {}

  var { code } = babel.transformFromAst(ast, raw, {
    plugins: [
      props => {
        return {
          visitor: {
            VariableDeclarator(path) {
              const name = path.node.id.name
              if (name.indexOf(id) === 0) {
                var keepit
                if (options.default && name === id) {
                  keepit = true
                } else if (name.indexOf('_')) {
                  const member = name.split('_')
                  for (let key in options.members) {
                    if (member[1] === key) {
                      keepit = true
                      break
                    }
                  }
                }

                if (!keepit) {
                  const p = path.findParent(
                    path => path.node.type === 'VariableDeclaration'
                  )
                  if (p) {
                    // console.log(p.node.declarations)

                    if (p.node.declarations[0].init) {
                      //   console.log(p.node.declarations[0].init)

                      if (p.node.declarations[0].init.type === 'Identifier') {
                        // console.log('ok', p.node.declarations[0].init.name)
                        list[p.node.declarations[0].init.name] = true

                        // console.log(list)
                      }
                    }

                    const top = p.findParent(p => p.node.type === 'Program')

                    // console.log(top)

                    // traverse(top.node, {
                    //   Scope({ scope }) {
                    //     console.log('hello')
                    //     if (scope.hasBinding(name)) {
                    //       //   console.log(scope.bindings)
                    //       //   console.log('HERE', scope.bindings[name])
                    //       //   scope.bindings[name]
                    //     }
                    //   }
                    // })

                    p.remove()
                  }
                }
              }
            }
          },
          post: path => {
            const parse = scope => {
              for (let k in list) {
                if (scope.bindings[k]) {
                  scope.bindings[k].path.remove()
                }
              }
            }

            parse(path.scope)

            traverse(path.node, {
              Scope({ scope }) {
                parse(scope)
              }
            })

            // for (let k in list) {

            //   if (path.scope.bindings[k]) {
            // path.scope.bindings[k].path.remove()
            // console.log()
            //   }
            // }
          }
        }
      },
      deadCode
    ]
  })

  //   console.log(code)

  return code
}
