// will allways add polyfill for older browsers
const parsePolyfills = ({ includeStatic }) => {
  return {
    MemberExpression(path) {
      const node = path.node
      if (
        node.property &&
        node.property.type === 'Identifier' &&
        node.property.name === 'assign' &&
        node.object &&
        node.object.type === 'Identifier' &&
        node.object.name === 'Object'
      ) {
        // includeStatic.push({ module: 'objectAssign' })
      }
    },
    Identifier(path) {
      const node = path.node
      if (node.name === 'fetch') {
        includeStatic.push({ module: 'fetch' })
      }
      //  else if (node.name === 'Promise') {
      //   // console.log('INCLUDE PROMISE')
      //   // for ie11
      //   includeStatic.push({ module: 'promise' })
      // } else if (node.name === 'Observable') {
      //   // for ie11
      //   includeStatic.push({ module: 'observable' })
      // }
    },
    Function(path) {
      // if (path.node.async || path.node.generator) {
      //   includeStatic.push({ module: 'regenerator' })
      //   includeStatic.push({ module: 'promise' })
      // }
    }
  }
}

module.exports = parsePolyfills
