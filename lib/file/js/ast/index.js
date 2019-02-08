const babylon = require('babylon')
const babel = require('babel-core')
const parseImport = require('./import')
const parseDynamicImports = require('./dynamicImport')
const parseStyle = require('./style')
const parseRequires = require('./require')
const parsePolyfills = require('./polyfills')
const { rewriteModule } = require('./rewrite')
const { mergeMethods, mergeMethodsArgs } = require('../../../util/object')
const deadCode2 = require('babel-plugin-minify-dead-code-elimination')
const deadCode = require('babel-plugin-remove-dead-code').default
const envVars = require('babel-plugin-transform-inline-environment-variables')
const classProps = require('babel-plugin-transform-class-properties')
const objectRest = require('babel-plugin-transform-object-rest-spread')
const reactPreset = require('babel-preset-react')
const chalk = require('chalk')
const ParsedFile = require('../../parsed')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const parseReactNativeWeb = require('./reactNativeWeb')
const { transform } = require('babel-core')
const useStrict = require('./useStrict')
const asyncComponent = require('./asyncComponent')
const componentPath = require('./componentPath')
const webpackInterop = require('./webpackInterop')

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

    const plugins = [
      [
        props => {
          return {
            visitor: {
              Program(path, file) {
                const { visitor } = objectRest({ types: t })
                traverse(
                  path.node,
                  mergeMethodsArgs(
                    [parsePolyfills({ includeStatic }), visitor],
                    file
                  )
                )
              }
            }
          }
        },
        { useBuiltIns: true }
      ],
      [objectRest, { useBuiltIns: true }],
      envVars,
      classProps,
      deadCode,
      parseStyle({ id, styles, dynamicStyles })
    ]

    if (process.env.NODE_ENV !== 'production') {
      plugins.push(componentPath({ file }))
    }

    if (type === 'node') {
      plugins.push(asyncComponent())
    }

    var { ast } = babel.transformFromAst(preAst, raw, {
      // sourceMaps: 'inline',
      // sourceFileName: file.path,
      presets: reactPreset,
      plugins
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
        webpackInterop({ exportStats, id })
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

    parseReactNativeWeb(file, includeStatic, result, id)

    // if (process.env.NODE_ENV !== 'production') {
    //   includeStatic.push({
    //     module: 'sourceMaps'
    //   })
    // }

    return result
  } catch (err) {
    console.log(err)
    result.error = err
    return result
  }
}
