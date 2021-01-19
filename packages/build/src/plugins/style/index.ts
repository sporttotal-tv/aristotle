// import { Parser } from 'acorn'
// import jsx from 'acorn-jsx'
// import { createSourceFile, ScriptTarget } from 'typescript'
import { parse } from '@babel/parser'

// const jsxParser = Parser.extend(jsx())

const replaceCharAtIndex = (store, i, str) => {
  store.text = `${store.text.substring(0, i)}${str}${store.text.substring(
    i + 1
  )}`
  store.offset += str.length - 1
}

const insertAtIndex = (store, i, str) => {
  store.text = `${store.text.substring(0, i)}${str}${store.text.substring(i)}`
  store.offset += str.length
}

const commentFromTo = (store, start, end) => {
  const { text } = store
  if (text[end] === ',') {
    end += 1
  }
  store.text = `${text.substring(0, start)}/*${text.substring(
    start,
    end
  )}*/${text.substring(end)}`
  store.offset += 4
}

const join = set => Array.from(set).join(' ')

const addClassName = (node, className) => {
  if (!node._classNames) {
    node._classNames = new Set()
  } else if (node._classNames.has(className)) {
    // this is to have the correct order of classNames
    node._classNames.delete(className)
  }
  node._classNames.add(className)
}

const parseStyle = (text, meta) => {
  // const ast = jsxParser.parse(text, {
  //   sourceType: 'module',
  //   ecmaVersion: 2020
  // })

  // const ast = createSourceFile('x.ts', text, ScriptTarget.Latest)

  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript']
  }).program

  const walk = (
    node,
    store,
    nodeWithStyleProp = null,
    parentStyleKey = null,
    parentNode = null,
    nodeWithStyleArg = null
  ) => {
    // console.log('????????????', NodeObject)
    // check if i have jsx and if style is being passed to something jsx
    if (node.type === 'ArrowFunctionExpression') {
      if (node.params[0] && node.params[0].type === 'ObjectPattern') {
        const props = node.params[0]
        let styleStart
        for (const prop of props.properties) {
          const name = prop.key && prop.key.name
          if (name === 'className') {
            break
          }
          if (name === 'style') {
            styleStart = prop.start
          }
        }

        if (styleStart) {
          nodeWithStyleArg = node
          // node.classNameCandidate = true
          // how to check efficiently in this node?
          // name classname a little bit funky as well e.g. parsedStylesClassName: ClassName (against colish)
          // so we want to add classname as prop here
          insertAtIndex(store, styleStart + store.offset, 'className, ')
        }
      }
    }

    if (nodeWithStyleProp) {
      if (node.type === 'ObjectProperty') {
        const start = node.start + store.offset
        const end = node.end + store.offset
        if (node.value.type === 'ObjectExpression') {
          commentFromTo(store, start, end)
          parentStyleKey = node.key.name || node.key.value
        } else if (
          node.value.type === 'StringLiteral' ||
          node.value.type === 'NumericLiteral'
        ) {
          if (!parentStyleKey) {
            commentFromTo(store, start, end)
          }
          const key = node.key.name
          const val = node.value.value
          let target = meta.css
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
            let className = `${Number(meta.styleCnt++).toString(16)}`
            while (className[0] <= '9') {
              className = `${Number(meta.styleCnt++).toString(16)}`
            }
            target[key][val] = className
            meta.cssCache = null
          }
          addClassName(nodeWithStyleProp, target[key][val])
        }
      } else if (node.type === 'Identifier') {
        if (node.name === 'style') {
          // eslint-disable-next-line
          addClassName(nodeWithStyleProp, '${className}')
          nodeWithStyleProp._classNameTemplate = true
        }
      } else if (node.type === 'SpreadElement') {
        if (node.argument.name === 'style') {
          // eslint-disable-next-line
          addClassName(nodeWithStyleProp, '${className}')
          commentFromTo(
            store,
            node.start + store.offset,
            node.end + store.offset
          )
          nodeWithStyleProp._classNameTemplate = true
        }
      }
    } else if (node.type === 'JSXAttribute') {
      if (node.name.name === 'style') {
        nodeWithStyleProp = parentNode
        nodeWithStyleProp._styleStart = node.start + store.offset
      } else if (node.name.name === 'className') {
        parentNode._classNameStart = node.value.start + store.offset
        parentNode._classNameEnd = node.value.end + store.offset
        return
      } else {
        return
      }
    }

    for (const i in node) {
      const val = node[i]
      if (typeof val === 'object' && val !== null) {
        if (val.type) {
          walk(
            val,
            store,
            nodeWithStyleProp,
            parentStyleKey,
            node,
            nodeWithStyleArg
          )
        } else if (Array.isArray(val)) {
          for (const childNode of val) {
            if (childNode) {
              walk(
                childNode,
                store,
                nodeWithStyleProp,
                parentStyleKey,
                node,
                nodeWithStyleArg
              )
            }
          }
        }
      }
    }

    if (node._classNames) {
      const isTemplateString = node._classNameTemplate
      if (node._classNameEnd) {
        // use existing className
        if (isTemplateString) {
          if (store.text[node._classNameStart] === '"') {
            replaceCharAtIndex(store, node._classNameStart, '{`')
            replaceCharAtIndex(store, node._classNameEnd, '`}')
            node._classNameEnd += 1
          } else {
            replaceCharAtIndex(store, node._classNameStart, '{`${')
            replaceCharAtIndex(store, node._classNameEnd + 2, '}`}')
            node._classNameEnd += 4
          }
        }
        insertAtIndex(
          store,
          node._classNameEnd - 1,
          ` ${join(node._classNames)}`
        )
      } else {
        // add a new className
        const str = isTemplateString
          ? node._classNames.size === 1
            ? `className={className} `
            : `className={\`${join(node._classNames)}\`} `
          : `className="${join(node._classNames)}" `
        insertAtIndex(store, node._styleStart, str)
      }
    }
  }

  const store = { offset: 0, text }
  walk(ast, store)

  return store.text
}

export default parseStyle
