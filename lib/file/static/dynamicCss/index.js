const hash = require('string-hash')

if (!global.aristotle) {
  global.aristotle = {
    parsedCSS: {},
    cssList: [],
    flush() {
      this.parsedCss = {}
      this.css = ''
      this.cssList = []
    }
  }
}

global.__dynC = (style, pseudo) => {
  const parsedCSS = global.aristotle.parsedCSS
  const cssList = global.aristotle.cssList
  // will be nessecary for ssr!
  // posible to import maybe or store on global
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
    cssList.push(className)
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
