const { build } = require('../build')
// const { transform } = require('babel-core')
// const es2015 = require('babel-preset-es2015')
// const env = require('babel-preset-env')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const UglifyJS = require('uglify-js')
const { logError } = require('../util/log')
const chalk = require('chalk')

const uid = num => {
  const div = (num / 26) | 0
  var str = String.fromCharCode(97 + (num % 26))
  if (div) {
    if ((div / 26) | 0) {
      str = str + uid(div)
    } else {
      str = str + String.fromCharCode(97 + (div % 26))
    }
  }
  return str
}

const buildResult = async props => {
  const { bundle, stats, type } = props
  const browser = bundle.browserBundle
  const node = bundle.nodeBundle

  if (type !== 'node') {
    if (browser.css) {
      if (browser.styles) {
        for (let key in browser.styles) {
          if (key.indexOf('style') === 0) {
            const id = stats.style.parsed[key] || uid(stats.style.cnt++)
            stats.style.parsed[key] = id
            const re = new RegExp(key, 'g')
            if (node) {
              node.css = node.css.replace(re, id)
              node.code = node.code.replace(re, id)
            }
          }
        }

        for (let key in stats.style.parsed) {
          const id = stats.style.parsed[key]
          const re = new RegExp(key, 'g')
          browser.css = browser.css.replace(re, id)
          browser.code = browser.code.replace(re, id)
        }
      }
      const css = browser.css
      try {
        browser.css = (await postcss([autoprefixer, cssnano]).process(css, {
          from: browser.path,
          to: 'dist/app.css'
        })).css
      } catch (err) {
        logError(
          err.input,
          {
            message: err.reason
          },
          'generated css'
        )
        browser.css = css
      }
    }

    var d = Date.now()
    // try to make this a partial as well
    // browser.code = transform(browser.code, { presets: [env, es2015] }).code
    // console.log(chalk.blue(`• Transpiled to es-2015 in ${Date.now() - d}ms`))
    // d = Date.now()

    if (props.minify !== false) {
      browser.min = UglifyJS.minify(browser.code, {
        toplevel: false,
        ie8: false,
        warnings: false,
        compress: {
          unsafe: true
        }
      })

      console.log(
        chalk.blue(
          `• Compressed bundle "${browser.path}" in ${Date.now() - d}ms`
        )
      )

      if (browser.min.DefaultsError || !browser.min.code) {
        if (browser.min.error.line) {
          logError(
            {
              line: browser.min.error.line,
              col: browser.min.error.col,
              source: browser.code
            },
            browser.min.error,
            'Uglify'
          )
        } else {
          console.log('Uglify ERROR', browser.min)
        }
      } else {
        browser.min = browser.min.code
      }
    } else {
      browser.min = browser.code
    }

    if (
      !bundle.parsed &&
      browser.bundleMap &&
      Object.keys(browser.bundleMap).length
    ) {
      for (let key in browser.bundleMap) {
        await buildResult({
          ...props,
          bundle: {
            parsed: true,
            browserBundle: browser.bundleMap[key],
            nodeBundle: node
          }
        })
      }
    }
  }

  return bundle
}

const buildProduction = async props => {
  process.env.NODE_ENV = 'production'
  var d = Date.now()
  const bundle = await build(props)
  console.log(chalk.blue(`• Build ${props.path} in ${Date.now() - d}ms`))

  const result = await buildResult({
    bundle,
    minify: props.minify,
    type: props.type,
    stats: {
      style: {
        cnt: 0,
        parsed: {}
      }
    }
  })

  return result
}

exports.buildProduction = buildProduction
