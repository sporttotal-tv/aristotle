const { replace } = require('../../../util/string')
const { rewriteModule } = require('./rewrite')

module.exports = (file, includeStatic, result, id) => {
  // move this to ReactNativeWeb transpilation fun
  if (file.resolved.browser.indexOf('react-native-web/dist/index.js') !== -1) {
    // console.log('is renative web', result)
    let modules = {}
    const react = rewriteModule('react')
    result.imports.unshift({
      module: 'react',
      replace: react,
      default: true,
      members: []
    })

    includeStatic.push({
      module: 'react-native.css'
    })

    const View = `\nvar __${id}_ViewReplacement = 'div';\n`

    // make this into a nice easy to use component

    // add react as deps

    const Text = `\nvar __${id}_TextReplacement = (props) => ${react}.createElement('div', props);\n`

    result.code = View + Text + result.code

    for (let i = 0; i < result.imports.length; i++) {
      const val = result.imports[i]
      let remove
      if (/\/View$/.test(val.module)) {
        modules.View = {
          replace: val.replace,
          replacement: `__${id}_ViewReplacement`
        }
        remove = true
      } else if (/\/Text$/.test(val.module)) {
        // needs some special props!
        // may want to change the imported module for this one
        modules.Text = {
          replace: val.replace,
          replacement: `__${id}_TextReplacement`
        }
        remove = true
      }
      if (remove) {
        result.imports.splice(i, 1)
        i--
      }
    }

    console.log(result.imports.map(val => val.module))

    for (let key in modules) {
      // str, find, replace
      result.code = replace(
        result.code,
        modules[key].replace,
        modules[key].replacement
      )
    }
  }
}
