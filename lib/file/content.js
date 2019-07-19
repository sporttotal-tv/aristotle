const fs = require('mz/fs')
const { isNativeNode, isJs } = require('./resolve/match')

const getFile = async (path, store) => {
  try {
    const file = await fs.readFile(path)

    // console.log('\nGET FILE', path, file.toString().length)
    if (store.watcher) {
      store.watcher.watch(path)
    }
    // use object to save memmory when files are the same
    return { raw: file.toString() }
  } catch (err) {
    // console.log('cannot get file', path)
    throw err
  }
}

const getContent = async (resolved, store) => {
  try {
    const content = {}
    const { node, browser } = resolved
    const isNative = isNativeNode(node)

    if (resolved.isEqual) {
      if (isNative) {
        const exists = await fs.exists(node)
        if (!exists) {
          throw new Error('file does not exist')
        }
      }

      const result = isNative ? { raw: '' } : await getFile(node, store)

      content.node = isNative ? { raw: '' } : result
      content.browser = isNative ? { raw: '' } : result
    } else {
      content.node = isNative ? { raw: '' } : await getFile(node, store)
      content.browser = await getFile(browser, store)
    }
    return content
  } catch (err) {
    const { node } = resolved

    if (isNativeNode(node) && !isJs(node)) {
      resolved.node = node + '.js'
      try {
        const r = getContent(resolved, store)

        if (r) {
          resolved.notNative = true
          return r
        }
      } catch (err) {
        throw err
      }
    }

    // console.log('cannot get content!')
    throw err
  }
}

module.exports = getContent
