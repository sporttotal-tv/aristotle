const { replace } = require('../../../util/string')
const { rewriteModule } = require('./rewrite')

module.exports = (file, includeStatic, result, id) => {
  // move this to ReactNativeWeb transpilation fun
  //   return
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

    const View = `\nvar __${id}_ViewReplacement = (props) => {
        const p = {}

        if (props.style) {
            if (Array.isArray(props.style)) {
                p.style = Object.assign.apply(Object, props.style)
            } else {
                p.style = props.style
            }
        }

        if (props.className) {
          p.className = 'v ' + props.className
        } else {
          p.className = 'v'
        }

        if (props.onClick) {
            p.onClick = props.onClick
        }

        return ${react}.createElement('div', p, props.children)   
        
    };\n`

    const TouchableOpacity = `\nvar __${id}_TouchableOpacity = (props) => {
        const p = {}

        if (props.style) {
            if (Array.isArray(props.style)) {
                p.style = Object.assign.apply(Object, props.style)
            } else {
                p.style = props.style
            }
        }

        if (props.className) {
          p.className = 'v ' + props.className
        } else {
          p.className = 'v'
        }

        if (props.onPress) {
            p.onClick = props.onPress
        }
        // also add href in here

        return ${react}.createElement('a', p, props.children)   
        
    };\n`

    const TouchableWithoutFeedback = `\nvar __${id}_TouchableWithoutFeedback = (props) => {
        const p = {}

        if (props.style) {
            if (Array.isArray(props.style)) {
                p.style = Object.assign.apply(Object, props.style)
            } else {
                p.style = props.style
            }
        }

        if (props.className) {
          p.className = 'v ' + props.className
        } else {
          p.className = 'v'
        }

        if (props.onPress) {
            p.onClick = props.onPress
        }
        // also add href in here

        return ${react}.createElement('a', p, props.children)   
        
    };\n`

    const Image = `\nvar __${id}_Image = (props) => {

        // resizeMode

        // console.log(props.resizeMode)

        const p = {}

        if (props.className) {
          p.className = 'i ' + props.className
        } else {
          p.className = 'i'
        }


        if (props.style) {
            if (Array.isArray(props.style)) {
                p.style = Object.assign.apply(Object, props.style)
            } else {
                p.style = props.style
            }
        }


        if (props.source) {
            if (! p.style) {
                p.style = {}
            }
            p.style.backgroundImage = 'url(' + props.source.uri + ')'

            if (props.resizeMode) {
                p.style.backgroundSize = props.resizeMode
            }
        }

        
        return ${react}.createElement('div',p)   

    };\n`

    // make this into a nice easy to use component

    // add react as deps

    const Text = `\nvar __${id}_TextReplacement = (props) => {
        const numberOfLines = props.numberOfLines
        const ellipsizeMode = props.ellipsizeMode
        // need to implement these!

        const p = {}

        if (props.className) {
            p.className = 't ' + props.className
        } else {
            p.className = 't'
        }

        if (props.style) {
            if (Array.isArray(props.style)) {
                p.style = Object.assign.apply(Object, props.style)
            } else {
                p.style = props.style
            }
        }

        return ${react}.createElement('span', p, props.children)   
    };\n`

    result.code =
      View +
      Text +
      TouchableOpacity +
      TouchableWithoutFeedback +
      Image +
      result.code

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
      } else if (/\/TouchableOpacity$/.test(val.module)) {
        // needs some special props!
        // may want to change the imported module for this one
        modules.TouchableOpacity = {
          replace: val.replace,
          replacement: `__${id}_TouchableOpacity`
        }
        remove = true
      } else if (/\/Image$/.test(val.module)) {
        // needs some special props!
        // may want to change the imported module for this one
        modules.Image = {
          replace: val.replace,
          replacement: `__${id}_Image`
        }
        remove = true
      } else if (/\/TouchableWithoutFeedback$/.test(val.module)) {
        // needs some special props!
        // may want to change the imported module for this one
        modules.Image = {
          replace: val.replace,
          replacement: `__${id}_TouchableWithoutFeedback`
        }
        remove = true
      }
      if (remove) {
        result.imports.splice(i, 1)
        i--
      }
    }

    // console.log(result.imports.map(val => val.module))

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
