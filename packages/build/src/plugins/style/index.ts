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

const generateClassName = (meta, cntField) => {
  let className
  while (!className || className[0] <= '9') {
    className = Number(meta[cntField]++).toString(16)
  }
  return className
}

const walkFnProps = (node, store, consts) => {
  const props = node.params[0]
  if (props && props.type === 'ObjectPattern') {
    let styleStart
    for (const prop of props.properties) {
      const name = prop.key && prop.key.name
      if (consts && name in consts) {
        delete consts[name]
      }
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

const getClassNames = (
  path,
  node,
  meta,
  store,
  hasArg,
  consts,
  keyframes = null
) => {
  const { type } = node
  if (type === 'StringLiteral' || type === 'NumericLiteral') {
    const value = getClassName(path, node.value, meta)
    node.type = 'StringLiteral'
    node.value = value
    return value
  }

  if (type === 'NullLiteral') {
    node.type = 'StringLiteral'
    node.value = ''
    return ''
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
      consts,
      keyframes
    )
    if (classNames && (!path || !path.length)) {
      const end = node.end + store.offset
      commentFromTo(store, start, end)
    }
    return classNames
  }

  if (type === 'Identifier') {
    if (consts && node.name in consts) {
      const styleObj = consts[node.name]
      if (!styleObj.classNames) {
        const styleOffset = styleObj.offset
        const storeOffset = store.offset
        store.offset = styleOffset
        styleObj.classNames = getClassNames(
          [],
          styleObj,
          meta,
          store,
          hasArg,
          styleObj.consts,
          keyframes
        )
        store.correction = store.offset - styleOffset
        store.offset = storeOffset + store.correction
      }
      return styleObj.classNames
    }
    if (hasArg && node.name === 'style') {
      return `\${className}`
    }
  } else if (type === 'SpreadElement') {
    return getClassNames(
      path,
      node.argument,
      meta,
      store,
      hasArg,
      consts,
      keyframes
    )
  } else if (type === 'ConditionalExpression') {
    const nPath = path || []
    if (
      getClassNames(
        nPath,
        node.consequent,
        meta,
        store,
        hasArg,
        consts,
        keyframes
      ) !== undefined &&
      getClassNames(
        nPath,
        node.alternate,
        meta,
        store,
        hasArg,
        consts,
        keyframes
      ) !== undefined
    ) {
      return `\${${generate(node).code}}`
    }
  } else if (type === 'ObjectExpression') {
    const isKeyframes = path && path[path.length - 1] === '@keyframes'
    const names = []

    for (const prop of node.properties) {
      const name = getClassNames(
        path,
        prop,
        meta,
        store,
        hasArg,
        consts,
        isKeyframes
      )
      if (name) {
        names.push(name)
      }
    }

    if (names.length) {
      let value
      node.type = 'StringLiteral'
      if (isKeyframes) {
        path = [...path]
        path[path.length - 1] = 'animationName'
        value = getClassName(path, names.join(','), meta)
      } else {
        value = names.join(keyframes ? ',' : ' ')
      }
      node.value = value
      return value
    }
  }
}

const cleanClassNameTemplate = str => {
  let clean
  for (let i = str.length - 1; i >= 0; i--) {
    let l = str[i]
    if (clean) {
      if (l === '"') {
        // add space
        str = `${str.substring(0, i + 1)} ${str.substring(i + 1)}`
      } else if (l === '{') {
        if (str[--i] === '$') {
          // remove space
          str = `${str.substring(0, i - 1)}${str.substring(i)}`
          clean = false
        }
      }
    } else if (l === '}') {
      if (str[--i] === '"' && str[--i] === '"') {
        i -= 5
        if (str[i] !== '"') {
          clean = true
        }
      }
    }
  }
  return str
}

const walkEach = (elements, meta, store, hasArg, consts, node, path) => {
  for (const el of elements) {
    walk(el, meta, store, hasArg, consts, node, path)
  }
}

const walk = (node, meta, store, hasArg, consts, pNode, path) => {
  if (!node) {
    return
  }
  if (pNode.consts) {
    consts = pNode.consts
  }
  const { type } = node
  if (type === 'JSXElement') {
    const r: {
      classNames?: string
      csStart?: number
      csEnd?: number
      csNode?: object
      start?: number
      end?: number
    } = {}
    const { openingElement, children } = node
    const { name, attributes } = openingElement

    if (path) {
      insertAtIndex(store, name.end + store.offset, ` _="${path}"`)
    }

    for (const childNode of attributes) {
      const res = walk(childNode, meta, store, hasArg, consts, node, null)
      if (res) {
        Object.assign(r, res)
      }
    }

    if (r.classNames) {
      const correction = store.correction || 0
      store.correction = 0

      if (r.csNode) {
        // @ts-ignore
        const { expression } = r.node.value
        if (expression) {
          if (expression.type === 'TemplateLiteral') {
            insertAtIndex(store, r.csEnd - 2 + correction, ` ${r.classNames}`)
          } else if (expression.type === 'Identifier') {
            insertAtIndex(store, r.csStart + 1 + correction, '`${')
            insertAtIndex(
              store,
              r.csEnd + 2 + correction,
              `} ${r.classNames}\``
            )
          } else {
            console.warn('UNHANDLED STYLE!!! FIX')
          }
        } else {
          replaceCharAtIndex(store, r.csStart + correction, '{`')
          replaceCharAtIndex(store, r.csEnd + correction, '`}')
          insertAtIndex(store, r.csEnd + correction, ` ${r.classNames}`)
        }
      } else {
        insertAtIndex(
          store,
          r.start + correction,
          `className={\`${r.classNames}\`} `
        )
      }
    }

    if (children) {
      walkEach(children, meta, store, hasArg, consts, node, null)
    }
  } else if (type === 'JSXExpressionContainer') {
    walk(node.expression, meta, store, hasArg, consts, node, path)
  } else if (type === 'ReturnStatement') {
    walk(node.argument, meta, store, hasArg, consts, node, path)
  } else if (type === 'BlockStatement') {
    walkEach(node.body, meta, store, hasArg, consts, node, path)
  } else if (
    type === 'ArrowFunctionExpression' ||
    type === 'FunctionDeclaration'
  ) {
    const hasArg = walkFnProps(node, store, consts)
    if (pNode.id && pNode.id.name) {
      path += `:${pNode.id.name}`
    }
    walk(node.body, meta, store, hasArg, consts, node, path)
  } else if (type === 'VariableDeclarator') {
    if (pNode.kind === 'const') {
      node.init.consts = consts
      node.init.offset = store.offset
      consts[node.id.name] = node.init
    }
    walk(node.init, meta, store, hasArg, consts, node, path)
  } else if (type === 'JSXAttribute') {
    if (node.name.name === 'style') {
      const { expression } = node.value
      const start = node.start + store.offset
      let classNames = getClassNames(
        null,
        expression,
        meta,
        store,
        hasArg,
        consts
      )
      const end = node.end + store.offset

      if (classNames && classNames.indexOf('""}') !== -1) {
        classNames = cleanClassNameTemplate(classNames)
      }

      return {
        classNames,
        start,
        end
      }
    } else if (node.name.name === 'className') {
      if (store.correction) {
        store.correction = 0
      }
      return {
        csStart: node.value.start + store.offset,
        csEnd: node.value.end + store.offset,
        csNode: node
      }
    }
  } else if (type === 'VariableDeclaration') {
    if (!pNode.consts) {
      pNode.consts = consts ? { ...consts } : {}
    }
    walkEach(node.declarations, meta, store, hasArg, pNode.consts, node, path)
  } else if (
    type === 'ExportNamedDeclaration' ||
    type === 'ExportDefaultDeclaration'
  ) {
    walk(node.declaration, meta, store, hasArg, consts, node, path)
  } else if (type === 'IfStatement' || type === 'ConditionalExpression') {
    walk(node.consequent, meta, store, hasArg, consts, node, path)
    walk(node.alternate, meta, store, hasArg, consts, node, path)
  } else if (type === 'CallExpression') {
    walkEach(node.arguments, meta, store, hasArg, consts, node, path)
  } else if (type === 'ForInStatement' || type === 'ForStatement') {
    walk(node.body, meta, store, hasArg, consts, node, path)
  } else if (type === 'ExpressionStatement') {
    walk(node.expression, meta, store, hasArg, consts, node, path)
  } else if (type === 'AssignmentExpression' || type === 'LogicalExpression') {
    walk(node.left, meta, store, hasArg, consts, node, path)
    walk(node.right, meta, store, hasArg, consts, node, path)
  } else if (type === 'ObjectExpression') {
    walkEach(node.properties, meta, store, hasArg, consts, node, path)
  } else if (type === 'ArrayExpression' || type === 'ArrayPattern') {
    walkEach(node.elements, meta, store, hasArg, consts, node, path)
  } else if (type === 'ObjectProperty') {
    walk(node.value, meta, store, hasArg, consts, node, path)
  } else if (type === 'JSXFragment') {
    walkEach(node.children, meta, store, hasArg, consts, node, path)
  }
}

const parseStyle = (text, meta, path) => {
  const store = { offset: 0, text, path }
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript', 'classProperties', 'classStaticBlock']
  })

  walkEach(ast.program.body, meta, store, null, null, ast.program, store.path)

  return store.text
}

export default parseStyle
