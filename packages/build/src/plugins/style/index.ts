import { parse } from '@babel/parser'

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

const walk = (
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
    if (typeof val === 'object' && val !== null && i !== 'test') {
      if (val.type) {
        walk(
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
            walk(
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

const parseStyle = (text, meta) => {
  const store = { offset: 0, text }
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript']
  }).program

  walk(meta, ast, store)

  return store.text
}

export default parseStyle
