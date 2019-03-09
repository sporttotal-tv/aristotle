// generate the class name here add it to a list and give access to this list in node.js

// global.parsedStyles
// bit harder to do but possible

global.cssStore = {}

global.__dynC = (style, pseudo) => {
  // will be nessecary for ssr!
  // posible to import maybe or store on global
  // console.log('xx', style, pseudo)

  // fix this
  // if pseuo
  // need to collect this somewhere
  return 'dynC'
}

global.__dynA = (val, m) => {
  return 'dynA'
}
