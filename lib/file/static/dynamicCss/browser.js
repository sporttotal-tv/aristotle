const hash = require('string-hash')
const parsedCSS = {}
var stylesheet

// eslint-disable-next-line
global.__dynC = (style, pseudo) => {
  if (!stylesheet) {
    const sheet = document.createElement('style')
    sheet.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(sheet)
    stylesheet = document.styleSheets[document.styleSheets.length - 1]
  }
  let className, type
  if (!pseudo) {
    className = 'a' + hash(style).toString(36)
  } else if (pseudo[0] === ':') {
    className = 's' + hash(style).toString(36)
    type = 1
  } else {
    className = 's' + hash(pseudo + style).toString(36)
    type = 2
  }
  if (!parsedCSS[className]) {
    let rule = ''
    if (!type) {
      rule = `@keyframes ${className} {${style}}`
    } else if (type === 1) {
      rule = `.${className}${pseudo} {${style}}`
      if (pseudo === ':hover') {
        rule = `@media (hover: hover) {${rule}}`
      }
    } else {
      rule = `${pseudo} {.${className} {${style}}}`
    }

    try {
      // if (rule.indexOf('::-webkit-') === -1) {
      stylesheet.insertRule(rule, 0)
      // }
    } catch (err) {
      // console.warn('ERROR CSS', rule)
    }
    parsedCSS[className] = true
  }
  return className
}

global.__dynA = (val, m) => {
  var r = m[val]
  if (!r) {
    const id = val.split(' ')[0]
    r = m[id]
    if (r) return val.replace(id, r)
  }
  return r || val
}
