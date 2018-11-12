const { build } = require('../build')
// const { transform } = require('babel-core')
// const es2015 = require('babel-preset-es2015')
// const env = require('babel-preset-env')

const chalk = require('chalk')
const compress = require('./compress')

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
  const node = bundle.server || bundle.nodeBundle

  // console.log(node)

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
    }

    if (props.minify !== false) {
      compress(browser)
      compress(node, true)
    } else {
      browser.min = browser.code
      node.min = node.code
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
  } else {
    if (props.minify !== false) {
      compress(node, true)
    } else {
      node.min = node.code
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
