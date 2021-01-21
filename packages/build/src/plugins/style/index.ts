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
      console.warn('NEED TO REFACTOR CONSTS HANDLING!!')
      // const styleObj = consts[node.name]
      // if (!styleObj.classNames) {
      //   styleObj.classNames = getClassNames(
      //     [],
      //     styleObj,
      //     meta,
      //     store,
      //     hasArg,
      //     styleObj.consts,
      //     keyframes
      //   )
      // }
      // console.log('???', styleObj.classNames)
      // return styleObj.classNames
    }
    if (hasArg && node.name === 'style') {
      return `\${className}`
    }
  } else if (type === 'SpreadElement') {
    if (hasArg && !path && node.argument.name === 'style') {
      return `\${className}`
    }
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
    const keyframes = path && path[path.length - 1] === '@keyframes'
    const names = []
    for (const prop of node.properties) {
      const name = getClassNames(
        path,
        prop,
        meta,
        store,
        hasArg,
        consts,
        keyframes
      )
      if (name) {
        names.push(name)
      }
    }
    if (names.length) {
      let value
      node.type = 'StringLiteral'
      if (keyframes) {
        path = [...path]
        path[path.length - 1] = 'animationName'
        value = getClassName(path, names.join(','), meta)
      } else {
        value = names.join(' ')
      }
      node.value = value
      return value
    }
  }
}

const walkEach = (elements, meta, store, hasArg, consts, node) => {
  for (const el of elements) {
    walk(el, meta, store, hasArg, consts, node)
  }
}

const walk = (node, meta, store, hasArg, consts, pNode) => {
  if (!node) {
    return
  }
  if (pNode.consts) {
    consts = pNode.consts
  }
  const { type } = node
  if (type === 'JSXElement') {
    // console.log(Object.keys(consts))
    const r: {
      classNames?: string
      // @ts-ignore
      csStart?: number
      csEnd?: number
      csNode?: object
      start?: number
      end?: number
    } = {}
    const { openingElement, children } = node
    const { name, attributes } = openingElement

    if (store.dataPath) {
      insertAtIndex(
        store,
        name.end + store.offset,
        ` data-dev-url="${store.dataPath}"`
      )
    }

    for (const childNode of attributes) {
      const res = walk(childNode, meta, store, hasArg, consts, node)
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
          } else {
            console.warn('UNHANDLED STYLE!!! FIX')
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

    if (children) {
      walkEach(children, meta, store, hasArg, consts, node)
    }
  } else if (type === 'JSXExpressionContainer') {
    walk(node.expression, meta, store, hasArg, consts, node)
  } else if (type === 'ReturnStatement') {
    walk(node.argument, meta, store, hasArg, consts, node)
  } else if (type === 'BlockStatement') {
    walkEach(node.body, meta, store, hasArg, consts, node)
  } else if (
    type === 'ArrowFunctionExpression' ||
    type === 'FunctionDeclaration'
  ) {
    const hasArg = transformFnProps(node, store)
    walk(node.body, meta, store, hasArg, consts, node)
  } else if (type === 'VariableDeclarator') {
    if (pNode.kind === 'const' && node.init.type === 'ObjectExpression') {
      node.init.consts = consts
      consts[node.id.name] = node.init
      console.log('----------', node.id.name)
    }
    walk(node.init, meta, store, hasArg, consts, node)
  } else if (type === 'JSXAttribute') {
    if (node.name.name === 'style') {
      const { expression } = node.value
      const start = node.start + store.offset
      console.log('---', consts)
      const classNames = getClassNames(
        null,
        expression,
        meta,
        store,
        hasArg,
        consts
      )
      const end = node.end + store.offset
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
    if (!pNode.consts) {
      pNode.consts = consts ? { ...consts } : {}
    }
    walkEach(node.declarations, meta, store, hasArg, pNode.consts, node)
  } else if (
    type === 'ExportNamedDeclaration' ||
    type === 'ExportDefaultDeclaration'
  ) {
    walk(node.declaration, meta, store, hasArg, consts, node)
  } else if (type === 'IfStatement' || type === 'ConditionalExpression') {
    walk(node.consequent, meta, store, hasArg, consts, node)
    walk(node.alternate, meta, store, hasArg, consts, node)
  } else if (type === 'CallExpression') {
    walkEach(node.arguments, meta, store, hasArg, consts, node)
  } else if (type === 'ForInStatement' || type === 'ForStatement') {
    walk(node.body, meta, store, hasArg, consts, node)
  } else if (type === 'ExpressionStatement') {
    walk(node.expression, meta, store, hasArg, consts, node)
  } else if (type === 'AssignmentExpression' || type === 'LogicalExpression') {
    walk(node.left, meta, store, hasArg, consts, node)
    walk(node.right, meta, store, hasArg, consts, node)
  } else if (type === 'ObjectExpression') {
    walkEach(node.properties, meta, store, hasArg, consts, node)
  } else if (type === 'ArrayExpression' || type === 'ArrayPattern') {
    walkEach(node.elements, meta, store, hasArg, consts, node)
  } else if (type === 'ObjectProperty') {
    walk(node.value, meta, store, hasArg, consts, node)
  } else {
    // console.log(type)
    // console.log(generate(node).code)
  }
}

const parseStyle = (text, meta, path) => {
  const store = { offset: 0, text }
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript', 'classProperties', 'classStaticBlock']
  })

  walkEach(ast.program.body, meta, store, null, null, ast.program)
  return store.text
}

export default parseStyle
