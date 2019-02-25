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
const { transform } = require('babel-core')
const useStrict = require('./useStrict')
const asyncComponent = require('./asyncComponent')
const componentPath = require('./componentPath')
const webpackInterop = require('./webpackInterop')
const { join } = require('path')
const es2015 = require('babel-preset-es2015')
const env = require('babel-preset-env')
const babylonOptions = require('./options')
const { replace } = require('../../../util/string')

/*
{
            MemberExpression(p) {
              console.log('???', p.node.object.type)
              if (
                p.node.object &&
                p.node.object.type === 'Identifier' &&
                p.node.object.name === 'undefined'
              ) {
                console.log('SOME THING WEIRD HERE')
                p.node.object.name = 'global'
              }
            }
          }

*/

exports.es2015 = code => {
  return transform(code, {
    presets: [env, es2015],
    plugins: [
      useStrict,
      props => {
        return {
          post: scope => {
            traverse(scope.path.node, {
              MemberExpression(p) {
                if (
                  p.node.object &&
                  p.node.object.type === 'Identifier' &&
                  p.node.object.name === 'undefined'
                ) {
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

    var preAst = babylon.parse(raw, babylonOptions)

    // var { ast: preAst2 } = babel.transformFromAst(preAst, raw, {
    //   // sourceMaps: 'inline',
    //   // sourceFileName: file.path,
    //   plugins: [
    //     [objectRest, { useBuiltIns: true }],
    //     () => ({
    //       visitor: parsePolyfills({ includeStatic })
    //     })
    //   ]
    // })

    const plugins = [
      [
        props => {
          return {
            visitor: {
              Program(path, file) {
                // console.log(path)

                const { visitor } = objectRest({ types: t })
                traverse(
                  preAst,
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
    // if (process.env.NODE_ENV !== 'production') {
    //   includeStatic.push({
    //     module: 'sourceMaps'
    //   })
    // }

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
          // module === 'TouchableOpacity' ||
          module === 'TouchableWithoutFeedback' ||
          module === 'ScrollView' ||
          module === 'Image'
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
