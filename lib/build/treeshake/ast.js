const babylon = require('babylon')
const babel = require('babel-core')
const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
const deadCode = require('babel-plugin-remove-dead-code').default
const traverse = require('babel-traverse').default

module.exports = (raw, id, options, browser) => {
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

  // ExportDefaultDeclaration
  // ExportNamedDeclaration

  let addFlag

  let bindings = {}
  const remove = []

  var { code } = babel.transformFromAst(ast, raw, {
    plugins: [
      () => {
        return {
          visitor: {
            VariableDeclarator(path) {
              const name = path.node.id.name
              if (name && name.indexOf(id) === 0) {
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
                  }
                  if (hasThing) {
                    for (let r of remove) {
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
                          //   console.log('is parent')
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
                // remove exports
                if (name === id + '_default') {
                  console.log(
                    'REMOVING DEFAULT',
                    name,
                    browser.parsed.exportStats
                  )
                  addFlag = true
                  // browser.parsed.exportStats.treeShakeRemoveDefault = true
                }

                VariableDeclaration.remove()
                if (binding) {
                  bindings[binding] = true
                }
              } else {
                t[3] = true
              }
            })

            const parse = scope => {
              for (let k in bindings) {
                if (scope.bindings[k]) {
                  scope.bindings[k].path.remove()
                  // also need to check if its used anywhere else thene removing list things
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
      deadCode,
      deadCode2
    ]
  })

  //   console.log(code)
  if (addFlag) {
    code += '\n// __TREESHAKE_DEFAULT__\n'
  }

  return code
}
