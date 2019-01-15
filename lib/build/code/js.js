const { rewriteModule } = require('../../file/js/ast/rewrite')
const { replace: replaceString } = require('../../util/string')
const chalk = require('chalk')

const isCjs = exportStats =>
  exportStats.moduleExports.length > 0 || exportStats.module

const createAllObject = (file, parsed) => {
  const exportStats = parsed.exportStats
  var code = `\n\nvar ${file.id}__ALL__ = {\n`
  exportStats.export.forEach((member, index) => {
    code += `${member}:${file.id}_${member}`
    if (index !== exportStats.export.length - 1) {
      code += ',\n'
    }
  })
  code += '\n};\n'
  return code
}

const mapAllExports = (leveledCJS, code, parsed, target, field) => {
  // console.log('?', parsed.exportStats.moduleExports)
  const p = `\n// ALL parse -${target.id} \n\n function ${
    target.id
  }__setAll () {\n ${parsed.exportStats.export
    .concat(parsed.exportStats.moduleExports)
    .filter(p => p !== '__esModule')
    .map(
      name =>
        ` if (${field}.${name} === void 0) { ${field}.${name} = ${
          target.id
        }_${name}; }\n`
    )
    .join('')} }\n\n`

  // you want to handle this smartly - doing too many now...
  if (!leveledCJS.includes(p)) {
    code = p + code
    leveledCJS.push(p)
  }

  code = `\n${target.id}__setAll();\n` + code

  return code
}

// export as needs to be imported
const allImports = (target, module, parsed, code, leveledCJS) => {
  const replaceAll = rewriteModule(module, '__ALL__')
  const exportStats = parsed.exportStats
  if (isCjs(exportStats)) {
    code = replaceString(code, replaceAll, target.id)
  } else {
    const p = createAllObject(target, parsed)
    if (!leveledCJS.includes(p)) {
      code = p + code
      leveledCJS.push(p)
    }
    code = replaceString(code, replaceAll, `${target.id}__ALL__`)
  }
  return code
}

const exportAllImports = (file, parsedFile, target, module, parsed, code) => {
  if (isCjs(parsed.exportStats)) {
    console.log(
      `😱 Sorry no support for "export * from" statements from common js modules - trying to import ${module}`
    )
  } else {
    parsed.exportStats.export.forEach(member => {
      if (!parsedFile.exportStats.export.includes(member)) {
        code += `\nvar ${file.id}_${member} = ${target.id}_${member};\n`
      }
    })
  }
  return code
}

const addToGlobal = (file, js) => {
  const id = file.id
  js.push(`global.${id} = ${id}`)
  file.browser.parsed.exportStats.export.forEach(member => {
    js.push(`global.${id}_${member} = ${id}_${member}`)
  })
  file.browser.parsed.exportStats.moduleExports.forEach(member => {
    js.push(`global.${id}_${member} = ${id}_${member}`)
  })
}

const parseJs = props => {
  const { file, bundle, type: bundleType, refs } = props
  const parsedFile = file[bundleType].parsed

  if (!parsedFile) {
    console.log(chalk.red(`cannot find parsed ${bundleType}`, file.path))
    return
  }

  const dependencies = file[bundleType].dependencies
  let { code, es2015 } = parsedFile

  dependencies.forEach(
    ({
      type,
      replace,
      path,
      members,
      all,
      exportFromAll,
      module,
      isExternal,
      restoreModule,
      default: defaultExports
    }) => {
      if (restoreModule) {
        if (type === 'require') {
          console.log(
            chalk.yellow(
              'Cannot find module',
              module,
              'revert to normal require statement'
            )
          )
          code = replaceString(code, replace, `require('${module}')`)
          if (es2015) {
            es2015 = replaceString(es2015, replace, `require('${module}')`)
          }
        } else {
          if (!bundle.errors) {
            bundle.errors = {}
          }

          bundle.errors[file.path] = file

          file.error = {
            message: 'Cannot find module ' + module
          }

          if (
            file.content &&
            file.content.node.raw &&
            file.content.node.raw.indexOf(module) !== -1
          ) {
            const lines = file.content.node.raw.split('\n')
            for (let i = 0; i < lines.length; i++) {
              const index = lines[i].indexOf(module)
              if (index !== -1) {
                file.error.message += ` (${i + 1}:${index})`
                break
              }
            }
          }
          code = replaceString(code, replace, '')
          if (es2015) {
            es2015 = replaceString(es2015, replace, '')
          }
        }
      } else {
        const target = file.store.files[path]
        // console.log(path)

        if (!target) {
          // console.log(chalk.red(`cannot find target ${bundleType}`, path))
          return
        }

        const parsed = target[bundleType].parsed

        if (!parsed) {
          console.log(chalk.red(`cannot find parsed ${bundleType}`, path))
          return
        }

        if (type === 'import' || type === 'require') {
          // require seems to be ok here as well..
          if (all) {
            code = allImports(target, module, parsed, code, bundle.leveledCJS)
            if (es2015) {
              es2015 = allImports(
                target,
                module,
                parsed,
                es2015,
                bundle.leveledCJSEs2015
              )
            }
          }

          if (exportFromAll) {
            code = exportAllImports(
              file,
              parsedFile,
              target,
              module,
              parsed,
              code
            )
            if (es2015) {
              es2015 = exportAllImports(
                file,
                parsedFile,
                target,
                module,
                parsed,
                es2015
              )
            }
          }

          members.forEach(member => {
            const variableName = `${target.id}_${member}`
            if (
              parsed.exportStats.export.indexOf(member) === -1 &&
              !bundle.leveledCJS.includes(variableName) &&
              parsed.exportStats.moduleExports.indexOf(member) === -1 // is this really nessecary
            ) {
              code =
                member === 'default'
                  ? `\nvar ${variableName} = (${
                      target.id
                    }.${member} !== void 0 ? ${target.id}.${member} : ${
                      target.id
                    });\n` + code
                  : `\nvar ${variableName} = ${target.id}.${member};\n` + code

              if (es2015) {
                es2015 =
                  member === 'default'
                    ? `\nvar ${variableName} = (${
                        target.id
                      }.${member} !== void 0 ? ${target.id}.${member} : ${
                        target.id
                      });\n` + es2015
                    : `\nvar ${variableName} = ${target.id}.${member};\n` +
                      es2015
              }
              bundle.leveledCJS.push(variableName)
            }
            code = replaceString(
              code,
              rewriteModule(module, member),
              variableName
            )
            if (es2015) {
              es2015 = replaceString(
                es2015,
                rewriteModule(module, member),
                variableName
              )
            }
          })

          if (defaultExports) {
            // exports.__esModule = true;
            if (parsed.exportStats.moduleExports.includes('__esModule')) {
              // console.log('ok so we have an __esModule here!')
              code = replaceString(
                code,
                rewriteModule(module),
                `(${target.id}.default !== void 0 ? ${target.id}.default : ${
                  target.id
                })`
              )
              if (es2015) {
                es2015 = replaceString(
                  es2015,
                  rewriteModule(module),
                  `(${target.id}.default !== void 0 ? ${target.id}.default : ${
                    target.id
                  })`
                )
              }
            } else {
              code = replaceString(code, rewriteModule(module), target.id)
              if (es2015) {
                es2015 = replaceString(es2015, rewriteModule(module), target.id)
              }
            }

            if (
              (type === 'require' &&
                parsed.exportStats.export.length &&
                !parsed.exportStats.default) ||
              (parsed.exportStats.moduleExports.length &&
                !parsed.exportStats.module)
            ) {
              code = mapAllExports(
                bundle.leveledCJS,
                code,
                parsed,
                target,
                target.id
              )
              if (es2015) {
                es2015 = mapAllExports(
                  bundle.leveledCJSEs2015,
                  es2015,
                  parsed,
                  target,
                  target.id
                )
              }
            }
          }
        } else if (type === 'dynamic') {
          if (bundleType === 'node') {
            code = replaceString(
              code,
              rewriteModule(module),
              `imports(${target.id})`,
              r => `imports\\([ '"]{1,20}${r}[ '"]{1,20}\\)`
            )
            if (es2015) {
              es2015 = replaceString(
                es2015,
                rewriteModule(module),
                `imports(${target.id})`,
                r => `imports\\([ '"]{1,20}${r}[ '"]{1,20}\\)`
              )
            }
          } else {
            code = replaceString(code, rewriteModule(module), target.id)
            if (es2015) {
              es2015 = replaceString(es2015, rewriteModule(module), target.id)
            }
          }
        }
      }
    }
  )

  bundle.js.push(
    `// ================== ${file.resolved[bundleType]} ${
      file.id
    } ===================`
  )
  if (es2015) {
    bundle.jsEs2015.push(
      `// ================== ${file.resolved[bundleType]} ${
        file.id
      } ==========ES2015=========`
    )
    bundle.jsEs2015.push(es2015)
  }

  bundle.js.push(code)

  if (!parsedFile.exportStats.module && !parsedFile.exportStats.default) {
    if (
      parsedFile.exportStats.export.includes('default') ||
      parsedFile.exportStats.moduleExports.includes('default')
    ) {
      bundle.vars.push(`var ${file.id} = {};`)
      bundle.js.push(`${file.id} = ${file.id}_default`)
      if (es2015) {
        bundle.jsEs2015.push(`${file.id} = ${file.id}_default`)
      }
    } else {
      bundle.vars.push(`var ${file.id} = {};`)
    }
  }
  // bundle.vars.push(`var ${file.id} = {};`)

  parsedFile.styles.forEach(val => {
    bundle.styles[val.hash] = { css: val.css, file, property: val.val }
  })

  if (refs[file.path] === bundle) {
    addToGlobal(file, bundle.js)
    if (es2015) {
      addToGlobal(file, bundle.jsEs2015)
    }
  }

  if (!bundle.isRoot && bundle.path === file.path) {
    bundle.js.push(`global.${file.id} = ${file.id}`)
    if (es2015) {
      bundle.jsEs2015.push(`global.${file.id} = ${file.id}`)
    }
  }
}

module.exports = parseJs
