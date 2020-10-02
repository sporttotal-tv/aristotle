const terser = require('terser')

// may need normal as well
// const reserved = require('./reservedProps')
const { logError } = require('../util/log')
const chalk = require('chalk')

const compress = (bundle, node) => {
  var d = Date.now()

  const opts = {
    toplevel: false,
    ie8: false,
    warnings: false,
    parse: {
      ecma: 8
    },
    compress: !node
      ? {
          unsafe: true,
          dead_code: true,
          inline: true,
          drop_console: true
        }
      : {}
  }

  bundle.min = terser.minify(bundle.code, opts)

  if (!node) {
    const x = terser.minify(bundle.es2015, opts)
    bundle.minEs2015 = x.code

    if (!bundle.minEs2015) {
      console.log(
        'ERROR ES5 TERSER CANNOT PARSE BUNDLE FALLBACK TO NON MINIFIED'
      )
      console.log(x)
      // console.log(opts)
      bundle.minEs2015 = bundle.es2015
      x.error.source = bundle.es2015
      // console.log(logError(x.error))
    }
  }

  console.log(
    chalk.blue(
      `• Compressed bundle "${bundle.path}" in ${Date.now() - d}ms ${
        bundle.min.code
          ? Math.round((bundle.min.code.length / bundle.code.length) * 100) /
            100
          : ''
      }`
    )
  )

  if (bundle.min.DefaultsError || !bundle.min.code) {
    if (bundle.min.error.line) {
      logError(
        {
          line: bundle.min.error.line,
          col: bundle.min.error.col,
          source: bundle.code
        },
        bundle.min.error,
        'Uglify'
      )
    } else {
      console.log('Uglify ERROR', bundle.min)
    }
  } else {
    bundle.min = bundle.min.code
  }
}

module.exports = compress
