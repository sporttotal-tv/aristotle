const hash = require('string-hash')
const parsedCSS = {}

var stylesheet = document.styleSheets[0]

if (stylesheet) {
  for (let i = 0; i < stylesheet.rules.length; i++) {
    const s = stylesheet.rules[i].selectorText
    if (s && s[0] === '.') {
      const t = s.slice(1)
      parsedCSS[t] = true
    }
  }
}

// eslint-disable-next-line

// check if allrdy parsed server
global.__dynC = (style, pseudo) => {
  if (!stylesheet) {
    const sheet = document.createElement('style')
    sheet.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(sheet)
    stylesheet = document.styleSheets[document.styleSheets.length - 1]
  }
  let className, type
  if (pseudo === 'c') {
    type = 3
    className = 's' + hash(style).toString(36)
  } else if (!pseudo) {
    className = 'a' + hash(style).toString(36)
    // also need to make this shorter - maybe add last parsed style to an index
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
    } else if (type === 3) {
      rule = `.${className} {${style}}`
    } else {
      rule = `${pseudo} {.${className} {${style}}}`
    }
    try {
      stylesheet.insertRule(rule, 0)
    } catch (err) {
      // console.warn('ERROR CSS', rule)
    }
    parsedCSS[className] = true
  } else {
    // console.log('!!!exists')
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
