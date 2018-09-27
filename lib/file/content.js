const fs = require('mz/fs')

const getFile = async (path, store) => {
  const file = await fs.readFile(path)
  if (store.watcher) {
    store.watcher.watch(path)
  }
  // use object to save memmory when files are the same
  return { raw: file.toString() }
}

const getContent = async (resolved, store) => {
  try {
    const content = {}
    const { node, browser } = resolved
    if (resolved.isEqual) {
      const result = await getFile(node, store)
      content.node = result
      content.browser = result
    } else {
      content.node = await getFile(node, store)
      content.browser = await getFile(browser, store)
    }
    return content
  } catch (err) {
    throw err
  }
}

module.exports = getContent
