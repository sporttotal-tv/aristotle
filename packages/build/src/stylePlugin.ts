import fs from 'fs'
import { Parser } from 'acorn'
import jsx from 'acorn-jsx'

const jsxParser = Parser.extend(jsx())

const comment = (text, start, end) => {
  return `${text.substring(0, start)}/*${text.substring(
    start,
    end
  )}*/${text.substring(end, text.length)}`
}

export default styles => {
  let styleCnt = 0
  const plugin = {
    name: 'css',
    setup(build) {
      build.onLoad(
        { filter: /\.tsx$|\.jsx$/, namespace: 'file' },
        async ({ path }) => {
          if (!(path in styles.fileCache)) {
            const text = await fs.promises.readFile(path, 'utf8')
            try {
              const ast = jsxParser.parse(text, {
                sourceType: 'module',
                ecmaVersion: 2020
              })
              const walk = (
                node,
                store,
                styleOwnerNode = null,
                parentStyleKey = null,
                parentNode = null
              ) => {
                if (styleOwnerNode) {
                  if (node.type === 'Property') {
                    const { offset, text } = store
                    const start = node.start + offset
                    let end = node.end + offset
                    if (text[end] === ',') {
                      end += 1
                    }
                    if (node.value.type === 'ObjectExpression') {
                      store.text = comment(text, start, end)
                      store.offset += 4
                      parentStyleKey = node.key.name || node.key.value
                    } else if (node.value.type === 'Literal') {
                      if (!parentStyleKey) {
                        store.text = comment(text, start, end)
                        store.offset += 4
                      }
                      const key = node.key.name
                      const val = node.value.value
                      let target = styles.css
                      if (parentStyleKey) {
                        if (!(parentStyleKey in target)) {
                          target[parentStyleKey] = {}
                        }
                        target = target[parentStyleKey]
                      }
                      if (!(key in target)) {
                        target[key] = {}
                      }
                      if (!(val in target[key])) {
                        let className = `${Number(styleCnt++).toString(16)}`
                        while (className[0] <= '9') {
                          className = `${Number(styleCnt++).toString(16)}`
                        }
                        target[key][val] = className
                        styles.cache = null
                      }
                      styleOwnerNode._classNames = styleOwnerNode._classNames
                        ? `${styleOwnerNode._classNames} ${target[key][val]}`
                        : target[key][val]
                    }
                  }
                } else if (node.type === 'JSXAttribute') {
                  if (node.name.name === 'style') {
                    styleOwnerNode = parentNode
                    styleOwnerNode._styleStart = node.start + store.offset
                  } else if (node.name.name === 'className') {
                    parentNode._classNameEnd = node.value.end + store.offset
                    return
                  } else {
                    return
                  }
                } else if (
                  node.type === 'VariableDeclaration' &&
                  node.kind === 'const'
                ) {
                  // console.log('-->', node)
                }

                for (const i in node) {
                  const val = node[i]
                  if (typeof val === 'object' && val !== null) {
                    if (val.type) {
                      walk(val, store, styleOwnerNode, parentStyleKey, node)
                    } else if (Array.isArray(val)) {
                      for (const childNode of val) {
                        if (childNode) {
                          walk(
                            childNode,
                            store,
                            styleOwnerNode,
                            parentStyleKey,
                            node
                          )
                        }
                      }
                    }
                  }
                }

                if (node._classNames) {
                  if (node._classNameEnd) {
                    // use existing className
                    const i = node._classNameEnd - 1
                    store.text = `${store.text.substring(0, i)} ${
                      node._classNames
                    }${store.text.substring(i, store.text.length)}`
                    store.offset += node._classNames.length + 1
                  } else {
                    // // add a new className
                    const i = node._styleStart
                    const str = `className="${node._classNames}" `
                    store.text = `${store.text.substring(
                      0,
                      i
                    )}${str}${store.text.substring(i, store.text.length)}`
                    store.offset += str.length
                  }
                }
              }

              const store = { offset: 0, text }
              walk(ast, store)
              styles.fileCache[path] = {
                contents: store.text,
                loader: 'jsx'
              }
              // console.log('parsed:', { path })
            } catch (e) {
              // console.log(path, e)
              return
            }
          } else {
            // console.log('cached:', { path })
          }
          return styles.fileCache[path]
        }
      )
    }
  }
  return plugin
}
