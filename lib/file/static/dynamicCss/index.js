// const hash = require('string-hash')
const uid = require('./uid')
const px = require('./px')
var cnt = 0
var cnt2 = 0

global.aristotle = {
  parsedCSS: {},
  hashMap: {},
  flush() {
    cnt = 0
    cnt2 = 0
    this.parsedCss = {}
    this.css = ''
    this.hashMap = {}
  }
}

global.__dynC = (style, pseudo) => {
  const parsedCSS = global.aristotle.parsedCSS
  const hashMap = global.aristotle.hashMap
  // will be nessecary for ssr!
  // posible to import maybe or store on global
  let className, type

  if (style.indexOf('undefined') !== -1) {
    return ''
  }

  style = px(style)

  let value = style
  let prefix = '_'

  if (pseudo === 'c') {
    type = 3
    prefix = ''
  } else if (pseudo[0] === ':') {
    type = 1
  } else {
    value = pseudo + style
    type = 2
  }

  className = hashMap[value]
  if (!className) {
    className = hashMap[value] = !prefix
      ? uid(++cnt2) + '_'
      : prefix + uid(++cnt)
    let rule = ''
    if (!type) {
      rule = `@keyframes ${className}{${style}}`
    } else if (type === 1) {
      rule = `.${className}${pseudo}{${style}}`
      if (pseudo === ':hover') {
        rule = `@media (hover:hover){${rule}}`
      }
    } else if (type === 3) {
      rule = `.${className}{${style}}`
    } else {
      rule = `${pseudo}{.${className}{${style}}}`
    }
    parsedCSS[className] = rule
    global.aristotle.css = Object.values(global.aristotle.parsedCSS).join('')
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
