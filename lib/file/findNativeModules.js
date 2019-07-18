const fs = require('mz/fs')
const path = require('path')
const { isDir } = require('../util/file')
const { isNativeNode } = require('./resolve/match')
const { parsePaths } = require('./js/parse')
const { rewriteModule } = require('./js/ast/rewrite')

const findNodeModules = async (p, level = 0) => {
  const dir = (await fs.stat(p)).isDirectory()

  if (dir) {
    const files = await fs.readdir(p)
    const dirs = files.filter(isDir).map(v => path.join(p, v))
    const native = files.filter(isNativeNode)
    if (level < 5) {
      const others = await Promise.all(
        dirs.map(v => findNodeModules(v, level + 1))
      )
      others.forEach(v => {
        if (v.length) {
          native.push(...v)
        }
      })
    }
    return native.map(v => path.join(p, v))
  } else {
    return []
  }
}

const findNativeModules = async (file, dynamicRequires) => {
  const nativeDeps = await findNodeModules(path.dirname(file.resolved.node))

  const parsed = nativeDeps.map(v => {
    const moduleName = v
    const replace = rewriteModule(moduleName)
    return {
      module: moduleName,
      members: [],
      replace,
      default: true
    }
  })

  file.node.parsed.requires.push(...parsed)

  /*

     const moduleName = node.arguments[0].value
          const replace = rewriteModule(moduleName)
          const requirer = {
            module: moduleName,
            members: [],
            replace
          }
          requires.push(requirer)
          requirer.default = true

 {
    module: './store',
    members: [],
    replace: 'MODULE_1xs4egr',
    default: true,
    type: 'require',
    parseDependencies: { node: true, browser: true },
    path: '/Users/jim/saulx/hub/client/react/Head/store'
  }
*/

  // parsePaths(file, nativeDeps, 'requires', 'node')

  file.node.dependencies.push(
    ...parsed.map(v => {
      return {
        module: v.module,
        members: [],
        replace: v.replace,
        default: true,
        type: 'require',
        parseDependencies: { node: true, browser: false },
        path: v.module
      }
    })
  )
}

module.exports = findNativeModules
