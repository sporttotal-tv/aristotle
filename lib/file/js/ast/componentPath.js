const componentPath = ({ file }) => {
  return () => {
    return {
      visitor: {
        JSXElement(path) {
          const inJSX = path.findParent(path => {
            return (
              path.node.type === 'JSXElement' &&
              path.node.openingElement.name &&
              path.node.openingElement.name.name &&
              path.node.openingElement.name.name[0] ===
                path.node.openingElement.name.name[0].toLowerCase()
            )
          })
          if (!inJSX) {
            const node = path.node
            if (
              file.path.indexOf('/lib/file/static/reactNativeWeb') === -1 &&
              node.openingElement.attributes &&
              node.openingElement.name &&
              node.openingElement.name.name &&
              node.openingElement.name.name.length > 2 &&
              (node.openingElement.name.name === 'View' ||
                node.openingElement.name.name === 'Text' ||
                node.openingElement.name.name === 'Image' ||
                node.openingElement.name.name === 'TouchableOpacity' ||
                node.openingElement.name.name ===
                  'TouchableOpacityWithoutFeedback' ||
                node.openingElement.name.name === 'Svg' ||
                (node.openingElement.name.name[0] ===
                  node.openingElement.name.name[0].toLowerCase() &&
                  !/g|path/.test(node.openingElement.name.name)))
            ) {
              const attr = {
                type: 'JSXAttribute',
                name: {
                  type: 'JSXIdentifier',
                  name: 'data-file'
                },
                value: {
                  type: 'StringLiteral',
                  extra: null,
                  raw: `"${file.path.replace(file.resolved.pkgDir, '')}"`,
                  value: file.path.replace(file.resolved.pkgDir, '')
                }
              }
              // console.log(node.openingElement.name.name)
              node.openingElement.attributes.push(attr)
            }
          }
        }
      }
    }
  }
}

module.exports = componentPath
