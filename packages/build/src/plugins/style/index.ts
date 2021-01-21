import { parse } from '@babel/parser'
import generate from '@babel/generator'

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

const getText = (store, start, end) => {
  return store.text.substring(start + store.offset, end + store.offset)
}

const join = set => {
  return Array.from(set).join(' ')
}

const addClassName = (node, className) => {
  if (!node._classNames) {
    node._classNames = new Set()
  } else if (node._classNames.has(className)) {
    // this is to have the correct order of classNames
    node._classNames.delete(className)
  }
  node._classNames.add(className)
}

const addAnimationName = (node, animationName) => {
  if (node._animationNames) {
    node._animationNames.push(animationName)
  } else {
    node._animationNames = [animationName]
  }
}

const generateClassName = (meta, cntField) => {
  let className
  while (!className || className[0] <= '9') {
    className = Number(meta[cntField]++).toString(16)
  }
  return className
}

const walkOld = (
  meta,
  node,
  store,
  nodeWithStyleProp = null,
  stylePath = null,
  parentNode = null,
  nodeWithStyleArg = null,
  conditional = null
) => {
  if (nodeWithStyleProp) {
    if (node.type === 'CallExpression') {
      return
    } else if (node.type === 'ObjectProperty') {
      const start = node.start + store.offset
      const end = node.end + store.offset
      if (
        // node.value.type === 'ConditionalExpression' ||
        node.value.type === 'ObjectExpression' ||
        node.value.type === 'StringLiteral' ||
        node.value.type === 'NumericLiteral'
      ) {
        // TODO only do when no unresolvable shi
        if (!stylePath) commentFromTo(store, start, end)
        const key = node.key.name || node.key.value

        // console.log('--->', node)
        stylePath = stylePath ? [...stylePath, key] : [key]
      }
    } else if (stylePath) {
      if (node.type === 'ConditionalExpression') {
        const value = getText(store, node.test.start - 2, node.test.end - 2)
        conditional = conditional ? [...conditional, value] : [value]
      } else if (
        node.type === 'NumericLiteral' ||
        node.type === 'StringLiteral'
      ) {
        let target = meta.css
        const val = node.value
        const isKeyframe = stylePath[0] === '@keyframes'
        for (const key of stylePath) {
          if (!(key in target)) {
            target[key] = {}
          }
          target = target[key]
        }
        if (!(val in target)) {
          const cntField = isKeyframe ? 'keyframesCnt' : 'styleCnt'
          const className = generateClassName(meta, cntField)
          target[val] = className
          meta.cssCache = null
        }
        if (isKeyframe) {
          addAnimationName(nodeWithStyleProp, target[val])
        } else {
          addClassName(nodeWithStyleProp, target[val])
        }
      }
    } else if (
      nodeWithStyleArg &&
      ((node.type === 'Identifier' && node.name === 'style') ||
        (node.type === 'SpreadElement' && node.argument.name === 'style'))
    ) {
      // eslint-disable-next-line
      addClassName(nodeWithStyleProp, '${className}')
      nodeWithStyleProp._classNameTemplate = true
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
  } else if (node.type === 'ArrowFunctionExpression') {
    const props = node.params[0]
    if (props && props.type === 'ObjectPattern') {
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
        insertAtIndex(store, styleStart + store.offset, "className = '', ")
      }
    }
  }

  for (const i in node) {
    const val = node[i]
    if (
      typeof val === 'object' &&
      val !== null &&
      i !== 'test' &&
      i !== 'key'
    ) {
      if (val.type) {
        walkOld(
          meta,
          val,
          store,
          nodeWithStyleProp,
          stylePath,
          node,
          nodeWithStyleArg,
          conditional
        )
      } else if (Array.isArray(val)) {
        for (const childNode of val) {
          if (childNode) {
            walkOld(
              meta,
              childNode,
              store,
              nodeWithStyleProp,
              stylePath,
              node,
              nodeWithStyleArg,
              conditional
            )
          }
        }
      }
    }
  }

  if (node._animationNames) {
    const animationName = node._animationNames.sort().join(',')
    if (!('animationName' in meta.css)) {
      meta.css.animationName = {}
    }
    if (!(animationName in meta.css.animationName)) {
      meta.css.animationName[animationName] = generateClassName(
        meta,
        'styleCnt'
      )
    }
    addClassName(node, meta.css.animationName[animationName])
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
      insertAtIndex(store, node._classNameEnd - 1, ` ${join(node._classNames)}`)
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

const transformFnProps = (node, store) => {
  const props = node.params[0]
  if (props && props.type === 'ObjectPattern') {
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
      insertAtIndex(store, styleStart + store.offset, "className = '', ")
      return node
    }
  }
}

const getClassName = (path, value, meta) => {
  let target = meta.css
  let isKeyframe
  for (const key of path) {
    if (key === '@keyframes') {
      isKeyframe = true
    }
    if (!(key in target)) {
      target[key] = {}
    }
    target = target[key]
  }
  if (!(value in target)) {
    const cntField = isKeyframe ? 'keyframesCnt' : 'styleCnt'
    meta.cssCache = null
    target[value] = generateClassName(meta, cntField)
  }
  return target[value]
}

const getClassNames = (path, node, meta, store, hasArg, keyframes = null) => {
  const { type } = node

  if (type === 'StringLiteral' || type === 'NumericLiteral') {
    node.value = getClassName(path, node.value, meta)
    return node.value
  }

  if (type === 'NullLiteral') {
    node.type = 'StringLiteral'
    node.value = ''
    return node.value
  }

  if (type === 'ObjectProperty') {
    const { key, value } = node
    const field = key.name || key.value
    const nPath = keyframes
      ? ['@keyframes', field]
      : path
      ? [...path, field]
      : [field]
    const start = node.start + store.offset
    const classNames = getClassNames(
      nPath,
      value,
      meta,
      store,
      hasArg,
      keyframes
    )
    if (classNames) {
      const end = node.end + store.offset
      commentFromTo(store, start, end)
    }
    return classNames
  }

  if (type === 'Identifier') {
    if (hasArg && node.name === 'style') {
      return `\${className}`
    }
  } else if (type === 'SpreadElement') {
    if (hasArg && path.length === 0 && node.argument.name === 'style') {
      return `\${className}`
    }
  } else if (type === 'ConditionalExpression') {
    const nPath = path || []
    if (
      getClassNames(nPath, node.consequent, meta, store, hasArg, keyframes) !==
        undefined &&
      getClassNames(nPath, node.alternate, meta, store, hasArg, keyframes) !==
        undefined
    ) {
      return `\${${generate(node).code}}`
    }
  } else if (type === 'ObjectExpression') {
    const keyframes = path && path[path.length - 1] === '@keyframes'
    const names = []
    for (const prop of node.properties) {
      const name = getClassNames(path, prop, meta, store, hasArg, keyframes)
      if (name) {
        names.push(name)
      }
    }
    if (names.length) {
      node.type = 'StringLiteral'
      if (keyframes) {
        path = [...path]
        path[path.length - 1] = 'animationName'
        node.value = getClassName(path, names.join(','), meta)
      } else {
        node.value = names.join(' ')
      }
      return node.value
    }
  }
}

const walk = (node, meta, store, hasArg = null) => {
  const { type } = node

  if (type === 'JSXElement') {
    const r: {
      classNames?: string
      // @ts-ignore
      csStart?: number
      csEnd?: number
      csNode?: object
      start?: number
      end?: number
    } = {}
    for (const childNode of node.openingElement.attributes) {
      const res = walk(childNode, meta, store, hasArg)
      if (res) {
        Object.assign(r, res)
      }
    }
    if (r.classNames) {
      if (r.csNode) {
        // @ts-ignore
        const { expression } = r.node.value
        if (expression) {
          if (expression.type === 'TemplateLiteral') {
            insertAtIndex(store, r.csEnd - 2, ` ${r.classNames}`)
          } else if (expression.type === 'Identifier') {
            insertAtIndex(store, r.csStart + 1, '`${')
            insertAtIndex(store, r.csEnd + 2, `} ${r.classNames}\``)
          }
        } else {
          replaceCharAtIndex(store, r.csStart, '{`')
          replaceCharAtIndex(store, r.csEnd, '`}')
          insertAtIndex(store, r.csEnd, ` ${r.classNames}`)
        }
      } else {
        insertAtIndex(store, r.start, `className={\`${r.classNames}\`} `)
      }
    }
  } else if (type === 'ReturnStatement') {
    if (node.argument) {
      walk(node.argument, meta, store, hasArg)
    }
  } else if (type === 'BlockStatement') {
    for (const childNode of node.body) {
      walk(childNode, meta, store, hasArg)
    }
  } else if (
    type === 'ArrowFunctionExpression' ||
    type === 'FunctionDeclaration'
  ) {
    const hasArg = transformFnProps(node, store)
    walk(node.body, meta, store, hasArg)
  } else if (type === 'VariableDeclarator') {
    walk(node.init, meta, store, hasArg)
  } else if (type === 'JSXAttribute') {
    if (node.name.name === 'style') {
      const { expression } = node.value
      const { start, end } = expression
      const classNames = getClassNames(null, expression, meta, store, hasArg)
      // TODO remove template if a single expression
      // if (/^\${/.test(classNames)) {
      //   const matches = classNames.match(/\${/g)
      //   if (matches.length === 1) {
      //     classNames = classNames.slice(2, -1)
      //   }
      // }
      return {
        classNames,
        start,
        end
      }
    } else if (node.name.name === 'className') {
      return {
        csStart: node.value.start + store.offset,
        csEnd: node.value.end + store.offset,
        csNode: node
      }
    }
  } else if (type === 'VariableDeclaration') {
    for (const childNode of node.declarations) {
      walk(childNode, meta, store, hasArg)
    }
  }
}

const parseStyle = (text, meta) => {
  const store = { offset: 0, text }
  const program = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript', 'classProperties', 'classStaticBlock']
  }).program
  try {
    for (const childNode of program.body) {
      walk(childNode, meta, store)
    }
  } catch (e) {
    console.log(e)
  }

  // console.log(meta.css)
  console.log(store.text)

  return store.text
}

export default parseStyle

/* walk nodes
- if 

*/
