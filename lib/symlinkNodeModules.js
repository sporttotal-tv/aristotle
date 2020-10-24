const fs = require('mz/fs')
const { join, dirname } = require('path')
const chalk = require('chalk')

const symlinkNodeModules = async result => {
  if (result.server) {
    const prevPkg = result.server.store.pkg
    const nodeModules = result.server.store.nodeModules
    if (nodeModules.length) {
      let packages
      const findDeps = async () => {
        const dependencies = {}
        console.info(' - Exclude modules in node.js', nodeModules)
        for (const moduleName of nodeModules) {
          if (
            prevPkg &&
            prevPkg.dependencies &&
            prevPkg.dependencies &&
            prevPkg.dependencies[moduleName]
          ) {
            // dependencies[moduleName] = prevPkg.dependencies[moduleName]
          } else {
            if (!packages) {
              packages = Object.keys(result.server.store.files).filter(v =>
                /\package\.json$/.test(v)
              )
            }
            for (const path of packages) {
              const file = result.server.store.files[path]
              if (file.node && file.node.parsed.js) {
                const parsedPkg = file.node.parsed.js
                if (parsedPkg.dependencies) {
                  if (
                    parsedPkg.dependencies &&
                    parsedPkg.dependencies[moduleName]
                  ) {
                    dependencies[moduleName] = join(
                      dirname(file.path),
                      'node_modules'
                    )
                    break
                  }
                }
              }
            }
          }
        }
        return dependencies
      }
      const dependencies = await findDeps()

      if (Object.keys(dependencies).length) {
        result.server.requireContext = dependencies
      }

      // for (const dep in dependencies) {
      // const dest = join(nodeModulesLocation, dep)
      // const hasFile = await fs.exists(dest)
      // if (!hasFile) {
      //   const originalPath = join(dependencies[dep], dep)
      //   const hasOriginal = await fs.exists(join(dependencies[dep], dep))
      //   console.log(hasOriginal)
      //   if (!hasOriginal) {
      //     console.log(
      //       chalk.red(
      //         `- Trying to symlink ${dep} from ${originalPath} but it does not exist`
      //       )
      //     )
      //   } else {
      //     console.log(
      //       chalk.white(`- Creating symlink for ${dep} from ${originalPath}`)
      //     )
      //     // console.log(originalPath, dest)
      //     await fs.symlink(originalPath, dest)
      //   }
      // }
      // }
    }
  }
}

module.exports = symlinkNodeModules
