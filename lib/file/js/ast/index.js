const parser = require('@babel/parser')
const babel = require('@babel/core')
const { transform } = babel

const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
// const deadCode = require('babel-plugin-remove-dead-code').default
const envVars = require('babel-plugin-transform-inline-environment-variables')

const classProps = require('@babel/plugin-proposal-class-properties').default
const objectRest = require('@babel/plugin-proposal-object-rest-spread').default

const reactPreset = require('@babel/preset-react').default
const traverse = require('@babel/traverse').default

const env = require('@babel/preset-env').default

const babylonOptions = require('./options')

const parseImport = require('./import')
const parseDynamicImports = require('./dynamicImport')
const parseStyle = require('./style')
const parseRequires = require('./require')
const parsePolyfills = require('./polyfills')
const { rewriteModule } = require('./rewrite')
const { mergeMethods } = require('../../../util/object')
const chalk = require('chalk')
const ParsedFile = require('../../parsed')
const useStrict = require('./useStrict')
const asyncComponent = require('./asyncComponent')
const componentPath = require('./componentPath')
const webpackInterop = require('./webpackInterop')
const { join } = require('path')
const { replace } = require('../../../util/string')

exports.es2015 = code => {
  return transform(code, {
    presets: [env],
    plugins: [
      useStrict,
      props => {
        return {
          post: scope => {
            traverse(scope.path.node, {
              // babel fix for es2015 hope this works now...
              MemberExpression(p) {
                if (
                  (p.node.object &&
                    (p.node.object.type === 'Identifier' &&
                      p.node.object.name === 'undefined')) ||
                  (p.node.object.type === 'UnaryExpression' &&
                    p.node.object.operator === 'void')
                ) {
                  p.node.object.type = 'Identifier'
                  p.node.object.name = 'global'
                }
              }
            })
          }
        }
      }
    ]
  }).code
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

    var preAst = parser.parse(raw, babylonOptions)

    var { ast: ast2 } = babel.transformFromAst(preAst, raw, {
      ast: true,
      code: false,
      plugins: [[objectRest, { useBuiltIns: true, loose: true }]]
    })

    const plugins = [
      parsePolyfills({ includeStatic }),
      envVars,
      classProps,
      deadCode2,
      parseStyle({ id, styles, dynamicStyles })
    ]

    if (process.env.NODE_ENV !== 'production') {
      plugins.push(componentPath({ file }))
    }

    if (type === 'node') {
      plugins.push(asyncComponent())
    }

    var { ast } = babel.transformFromAst(ast2, raw, {
      ast: true,
      code: false,
      plugins,
      presets: [reactPreset]
    })

    // we are not doing the mappings internaly anymore!
    var { ast: ast3 } = babel.transformFromAst(ast, raw, {
      ast: true,
      code: false,
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
        webpackInterop({ exportStats, id })
      ]
    })

    var { code } = babel.transformFromAst(ast3, raw, {
      plugins: [webpackInterop({ exportStats, id })]
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

    if (
      exportStats.moduleExports &&
      exportStats.moduleExports[0] === '__esModule' &&
      (exportStats.export.length || exportStats.default)
    ) {
      exportStats.moduleExports = []
    }

    // if react native web use some internals
    if (
      file.resolved.browser.indexOf('react-native-web/dist/index.js') !== -1
    ) {
      // console.log('REACT NATIVE')
      imports.forEach(val => {
        const segments = val.module.split('/')
        const module = segments[segments.length - 1]
        if (
          module === 'View' ||
          module === 'Text' ||
          module === 'TouchableOpacity' ||
          module === 'TouchableWithoutFeedback' ||
          module === 'ScrollView' ||
          module === 'Image' ||
          module === 'ActivityIndicator' ||
          module === 'Animated' ||
          module === 'Picker' ||
          module === 'SectionList' ||
          module === 'TextInput'
        ) {
          val.module = join(__dirname, '../../static/reactNativeWeb/', module)
          const moduleName = rewriteModule(val.module)
          result.code = replace(result.code, val.replace, moduleName)
          val.replace = moduleName
        }
      })
    }

    return result
  } catch (err) {
    console.log(err)
    result.error = err
    return result
  }
}
