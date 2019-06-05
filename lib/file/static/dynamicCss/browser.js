// const hash = require('string-hash')
const parsedCSS = {}
const hashMap = {}
const uid = require('./uid')
const px = require('./px')

var cnt = 0
var cnt2 = 0
var stylesheet
// fist check for id="aristotle"
var resolveStylesheet = document.getElementById('aristotle-css')

// then look for a correctly formatted stylesheet
if (!resolveStylesheet) {
  const styleSheets = document.styleSheets
  for (let i = 0; i < styleSheets.length; i++) {
    const sheet = styleSheets[i]
    if (sheet) {
      const rules = sheet.rules || sheet.cssRules
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j]
        const s = rule.selectorText
        if (s && s[s.length - 1] === '_') {
          resolveStylesheet = sheet
          break
        }
      }
    }
  }
}

// then try the first
if (!resolveStylesheet) {
  resolveStylesheet = document.styleSheets[0]
}

const resolvedMap = {}

if (resolveStylesheet) {
  const rules = resolveStylesheet.rules || resolveStylesheet.cssRules
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const s = rule.selectorText
    // still missing hover / pseudo
    if (s && s[0] === '.' && s[s.length - 1] === '_') {
      cnt2++
      const t = s.slice(1)
      const style = rule.style[0] + ':' + rule.style[rule.style[0]]
      parsedCSS[t] = true
      // console.log('MATCH', t, style)
      resolvedMap[style] = t
      if (!hashMap[style]) {
        hashMap[style] = t
      }
    }
  }
}

// if margin need to add px filler

global.__dynC = (style, pseudo) => {
  if (!stylesheet) {
    const sheet = document.createElement('style')
    sheet.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(sheet)
    stylesheet = document.styleSheets[document.styleSheets.length - 1]
  }

  if (style.indexOf('undefined') !== -1) {
    return ''
  }

  style = px(style)

  let className, type
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
    // console.log('!!!exists', className)
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
