const parser = require('@babel/parser')
const babel = require('@babel/core')
const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
// const deadCode = require('babel-plugin-remove-dead-code').default
const traverse = require('@babel/traverse').default
const opts = require('../../file/js/ast/options')
// const { showcode } = require('../../util/log')
module.exports = (raw, id, options, browser) => {
  if (options.all) {
    return raw
  }

  var ast = parser.parse(raw, opts)

  // ExportDefaultDeclaration
  // ExportNamedDeclaration

  let addFlag

  const bindings = {}
  const remove = []
  // console.log(options)

  var { code } = babel.transformFromAst(ast, raw, {
    plugins: [
      () => {
        return {
          visitor: {
            VariableDeclarator(path) {
              const name = path.node.id.name

              // ------
              if (name && name.indexOf(id) === 0) {
                var keepit
                if (options._dyn) {
                  keepit = true
                }

                if (
                  (options.default && name === id) ||
                  (options.default && name === id + '_default')
                ) {
                  // need to get more options
                  keepit = true
                } else if (name.indexOf('_')) {
                  const member = name.split('_')
                  for (const key in options.members) {
                    if (
                      member[1] === key ||
                      (member[1] === 'default' && options.default)
                    ) {
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
                    if (p.node.declarations[0].init) {
                      if (p.node.declarations[0].init.type === 'Identifier') {
                        remove.push([p, path, p.node.declarations[0].init.name])
                      } else {
                        remove.push([p, path])
                      }
                    }
                  }
                }
              }
            }
          },
          post: ({ scope }) => {
            remove.forEach(t => {
              const [VariableDeclaration, VariableDeclarator, binding] = t
              const name = VariableDeclarator.node.id.name
              let hasThing
              traverse(scope.path.node, {
                Identifier(x) {
                  if (x.node.name === name) {
                    if (x.node !== VariableDeclarator.node.id) {
                      hasThing = x
                    }
                  } else if (x.node.name === binding) {
                    if (x.node !== VariableDeclarator.node.init) {
                      hasThing = x
                      // console.log(x.node)
                    }
                  }

                  if (hasThing) {
                    for (const r of remove) {
                      if (!r[3]) {
                        const y = r[0]
                        if (
                          hasThing.findParent(p => {
                            if (p.node === y.node) {
                              return true
                            } else {
                              if (
                                p.node.declarations &&
                                p.node.declarations[0] &&
                                p.node.declarations[0].id &&
                                p.node.declarations[0].id.name === r[2]
                              ) {
                                return true
                              }
                            }
                          })
                        ) {
                          // console.log('is parent')
                          hasThing = false
                          break
                        }
                      }
                    }
                    if (hasThing) {
                      x.stop()
                    }
                  }
                }
              })
              if (!hasThing) {
                // // ================== /Users/jim/saulx/v2/apps/cms/node_modules/react-redux/es/utils/Subscription.js $1000c1j ===================
                // remove exports
                // console.log(name)
                if (name === id + '_default') {
                  console.log(
                    'REMOVING DEFAULT',
                    name,
                    options,
                    browser.parsed.exportStats
                  )
                  addFlag = true
                  // browser.parsed.exportStats.treeShakeRemoveDefault = true
                }

                VariableDeclaration.remove()
                if (binding) {
                  // console.log('BINDING', binding)
                  bindings[binding] = true
                }
              } else {
                t[3] = true
              }
            })

            const parse = scope => {
              for (const k in bindings) {
                if (scope.bindings[k]) {
                  // console.log('-->', k)
                  scope.bindings[k].path.remove()
                  // also need to check if its used anywhere else  removing list things
                }
              }
            }
            parse(scope)
            traverse(scope.path.node, {
              Scope({ scope }) {
                parse(scope)
              }
            })
          }
        }
      },
      deadCode2
    ]
  })

  // console.log(remove)

  // remove.forEach(n => {
  //   // console.log('xx', n[1].parent)
  //   console.log('REMOVE -----------------')
  //   showcode(raw, n[1].parent)
  // })

  if (addFlag) {
    code += '\n// __TREESHAKE_DEFAULT__\n'
  }

  return code
}
