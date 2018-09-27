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

const mapAllExports = (bundle, code, parsed, target, field) => {
  const p = `\n// ALL SHIT -${target.id} \n\n function ${
    target.id
  }__setAll () {\n ${parsed.exportStats.export
    .concat(parsed.exportStats.moduleExports)
    .filter(p => p !== '__esModule')
    // .map(
    //   name =>
    //     `if (${field}.${name} === void 0) {
    //       Object.defineProperty(${field}, '${name}', {
    //         configurable: true,
    //         get: function () {
    //           console.log('FUCK', '${name}', ${target.id}_${name} );
    //           return ${target.id}_${name}
    //         }
    //       });
    //   }\n`
    // )
    .map(
      name =>
        ` if (${field}.${name} === void 0) { ${field}.${name} = ${
          target.id
        }_${name}; }\n`
    )
    .join('')} }\n\n`

  // kan dit iig

  // you want to handle this smartly - doing too many now...
  // better to define with a getter...

  if (!bundle.leveledCJS.includes(p)) {
    code = p + code
    bundle.leveledCJS.push(p)
  }

  code = `\n${target.id}__setAll();\n` + code

  return code
}

// export as needs to be imported
const allImports = (target, module, parsed, code, bundle) => {
  const replaceAll = rewriteModule(module, '__ALL__')
  const exportStats = parsed.exportStats
  if (isCjs(exportStats)) {
    code = replaceString(code, replaceAll, target.id)
  } else {
    const p = createAllObject(target, parsed)
    if (!bundle.leveledCJS.includes(p)) {
      code = p + code
      bundle.leveledCJS.push(p)
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

const addToGlobal = (file, bundle) => {
  const id = file.id
  bundle.js.push(`global.${id} = ${id}`)
  file.browser.parsed.exportStats.export.forEach(member => {
    bundle.js.push(`global.${id}_${member} = ${id}_${member}`)
  })
  file.browser.parsed.exportStats.moduleExports.forEach(member => {
    bundle.js.push(`global.${id}_${member} = ${id}_${member}`)
  })
}

const parseJs = props => {
  const { file, bundle, type: bundleType, refs } = props
  const parsedFile = file[bundleType].parsed
  const dependencies = file[bundleType].dependencies
  let { code } = parsedFile

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
            chalk.red(
              'Cannot find module',
              module,
              'revert to normal require statement'
            )
          )
          code = replaceString(code, replace, `require('${module}')`)
        } else {
          console.log(chalk.red('Cannot find module', module))
          code = replaceString(code, replace, '')
        }
      } else {
        const target = file.store.files[path]
        const parsed = target[bundleType].parsed
        if (type === 'import' || type === 'require') {
          // require seems to be ok here as well..
          if (all) {
            code = allImports(target, module, parsed, code, bundle)
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
              bundle.leveledCJS.push(variableName)
            }
            code = replaceString(
              code,
              rewriteModule(module, member),
              variableName
            )
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
            } else {
              code = replaceString(code, rewriteModule(module), target.id)
            }

            if (
              (type === 'require' &&
                parsed.exportStats.export.length &&
                !parsed.exportStats.default) ||
              (parsed.exportStats.moduleExports.length &&
                !parsed.exportStats.module)
            ) {
              code = mapAllExports(bundle, code, parsed, target, target.id)
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
          } else {
            code = replaceString(code, rewriteModule(module), target.id)
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

  bundle.js.push(code)

  if (!parsedFile.exportStats.module && !parsedFile.exportStats.default) {
    if (
      parsedFile.exportStats.export.includes('default') ||
      parsedFile.exportStats.moduleExports.includes('default')
    ) {
      bundle.vars.push(`var ${file.id} = {};`)
      bundle.js.push(`${file.id} = ${file.id}_default`)
    } else {
      bundle.vars.push(`var ${file.id} = {};`)
    }
  }

  // check if this is nessecary

  // if (
  //   parsedFile.exportStats.moduleExports.includes('__esModule') &&
  //   !parsedFile.exportStats.export.includes('default') &&
  //   !parsedFile.exportStats.export.includes('default')
  // ) {
  //   bundle.js.push(`${file.id}.__esModule = true;`)
  // }

  parsedFile.styles.forEach(val => {
    bundle.styles[val.hash] = val.css
  })

  if (refs[file.path] === bundle) {
    addToGlobal(file, bundle)
  }

  if (!bundle.isRoot && bundle.path === file.path) {
    bundle.js.push(`global.${file.id} = ${file.id}`)
  }
}

module.exports = parseJs
