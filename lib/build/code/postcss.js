const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
// const { logError } = require('../../util/log')
const fbFixes = require('postcss-flexbugs-fixes')
const unit = require('postcss-default-unit')

module.exports = async browser => {
  const css = browser.css
  if (css) {
    try {
      browser.css = (
        await postcss([
          unit({
            ignore: {
              'stop-opacity': true,
              'animation-name': true
            }
          }),
          fbFixes,
          autoprefixer({
            overrideBrowserslist: ['last 1 version', 'cover 95%', 'IE 10']
          }),
          cssnano
        ]).process(css, {
          from: browser.path,
          to: 'dist/app.css'
        })
      ).css
    } catch (err) {
      let error
      // no add it to file!!!
      if (!browser.errors) {
        browser.errors = {}
      }

      // how to relate definitions back to content files - must be possible as well!
      const cssFile = browser.cssFiles.find(val => val.css === err.input.source)
      let key = browser.path

      if (cssFile) {
        // console.log('css file???')
        key = cssFile.file.path
      } else {
        const line = err.input.source.split('\n')[err.input.line - 1]

        // console.log(err.input.source.split('\n'), err.line)
        if (browser.styles) {
          for (let key2 in browser.styles) {
            if (line.indexOf(key2) !== -1) {
              const file = browser.styles[key2].file
              error = file
              key = file.path
              file.error = {
                message: err.reason
              }

              const lines = file.content.node.raw.split('\n')

              for (let i = 0; i < lines.length; i++) {
                const index = lines[i].indexOf(browser.styles[key2].property)
                if (index !== -1) {
                  error.error.message += ` (${i + 1}:${index})`
                  break
                }
              }
              break
            }
          }
        }
      }

      browser.errors[key] = error || {
        content: { node: { raw: err.input } },
        path: key,
        error: {
          message: err.reason
        }
      }

      browser.css = css
    }
  }
}
