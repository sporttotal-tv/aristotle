const babylon = require('babylon')
const babel = require('babel-core')
const parseImport = require('./import')
const parseDynamicImports = require('./dynamicImport')
const parseStyle = require('./style')
const parseRequires = require('./require')
const parsePolyfills = require('./polyfills')
const { rewriteModule } = require('./rewrite')
const { mergeMethods } = require('../../../util/object')
const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
const deadCode = require('babel-plugin-remove-dead-code').default
const envVars = require('babel-plugin-transform-inline-environment-variables')
const classProps = require('babel-plugin-transform-class-properties')
const objectRest = require('babel-plugin-transform-object-rest-spread')
const reactPreset = require('babel-preset-react')
const chalk = require('chalk')
const ParsedFile = require('../../parsed')
const replaceVariables = require('./replaceVariables')
const { isId } = require('../../resolve/path')
const { transform } = require('babel-core')
const useStrict = require('./useStrict')

const es2015 = require('babel-preset-es2015')
const env = require('babel-preset-env')

const babylonOptions = require('./options')

exports.es2015 = code => {
  return transform(code, { presets: [env, es2015], plugins: [useStrict] }).code
}

exports.rewriteModule = rewriteModule

exports.parseCode = (file, raw, dontParseRequires, type) => {
  const id = file.id

  const result = new ParsedFile(id)

  const {
    styles,
    dynamicStyles,
    exportStats,
    imports,
    dynamicImports,
    requires,
    includeStatic
  } = result

  try {
    if (!raw) {
      raw = ''
    }

    if (raw.length > 1e5) {
      console.log(
        chalk.yellow('Parsing large file, can take up to a minute ⏳  '),
        file.path
      )
    }

    var preAst = babylon.parse(raw, babylonOptions)

    var { ast: preAst2 } = babel.transformFromAst(preAst, raw, {
      plugins: [
        [objectRest, { useBuiltIns: true }],
        props => {
          return {
            visitor: parsePolyfills({ includeStatic })
          }
        }
      ]
    })

    var { ast } = babel.transformFromAst(preAst2, raw, {
      // sourceMaps: 'inline',
      // sourceFileName: file.path,
      presets: reactPreset,
      plugins: [
        envVars,
        classProps,
        deadCode,
        parseStyle({ id, styles, dynamicStyles })
      ]
    })

    // we are not doing the mappings internaly anymore!
    var { code } = babel.transformFromAst(ast, raw, {
      // sourceMaps: 'inline',
      // sourceFileName: file.path,
      plugins: [
        deadCode2,
        useStrict,

        props => {
          return {
            visitor: mergeMethods(
              parseImport({ exportStats, id, imports, includeStatic }),
              parseRequires({ exportStats, id, requires, dontParseRequires }),
              parseDynamicImports({ exportStats, id, dynamicImports })
            )
          }
        },

        props => {
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
                        if (
                          exportStats.moduleExports.indexOf('__esModule') === -1
                        ) {
                          exportStats.moduleExports.push('__esModule')
                        }
                      }
                    }
                  } catch (e) {
                    console.log('oopsie')
                  }
                } else if (
                  (node.property.name === 'default' ||
                    node.property.value === 'default') &&
                  !node.parsed &&
                  node.object.type === 'Identifier' &&
                  path.parent &&
                  path.parent.type !== 'AssignmentExpression' &&
                  !path.findParent(p => p.node.parsed)
                ) {
                  if (path.scope === this.program.scope) {
                    try {
                      const block = babylon.parse(
                        `((${node.object.name}.default !== void 0 && ${
                          node.object.name
                        }.default) || ${node.object.name})`,
                        babylonOptions
                      )
                      block.program.body[0].expression.left.parsed = true
                      block.program.body[0].parsed = true
                      path.replaceWith(block.program.body[0])
                      path.node.parsed = true
                    } catch (e) {
                      console.log('cannot create block..')
                    }
                  }
                }
              }
            },

            post() {
              const path = this.program
              for (let key in path.scope.bindings) {
                if (path.scope.hasOwnBinding(key)) {
                  if (!isId(key)) {
                    replaceVariables(key, `_${id}_${key}`, path)
                  }
                }
              }
              remove.forEach(p => p.remove())
            }
          }
        }
      ]
    })

    result.code = code

    if (styles.length || dynamicStyles.length) {
      includeStatic.push({
        module: 'reset.css'
      })
    }

    if (dynamicStyles.length) {
      includeStatic.push({
        module: 'dynamicCss'
      })
    }

    if (dynamicImports.length) {
      includeStatic.push({
        module: 'dynamicImports'
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      includeStatic.push({
        module: 'sourceMaps'
      })
    }

    return result
  } catch (err) {
    console.log('AST ERROR', err, file.path)
    result.error = err
    return result
  }
}
