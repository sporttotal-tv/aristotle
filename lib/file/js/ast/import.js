const t = require('babel-types')
const template = require('babel-template')
const variable = template(`var name = source;`)
const { rewriteModule } = require('./rewrite')
const replaceVariables = require('./replaceVariables')

const parseImportDeclaration = (node, imports, path) => {
  const moduleName = node.source.value

  const importer = {
    module: moduleName,
    members: [],
    replace: rewriteModule(moduleName)
  }
  imports.push(importer)

  const Program = path.findParent(path => path.node.type === 'Program')

  node.specifiers.forEach(node => {
    const name = node.local.name
    if (node.type === 'ImportNamespaceSpecifier') {
      importer.all = true
      replaceVariables(name, rewriteModule(moduleName, '__ALL__'), Program)
    } else if (node.type === 'ImportDefaultSpecifier') {
      importer.default = true
      replaceVariables(name, rewriteModule(moduleName), Program)
    } else if (node.type === 'ImportSpecifier') {
      const importedName = node.imported.name
      importer.members.push(importedName)
      replaceVariables(name, rewriteModule(moduleName, importedName), Program)
    }
  })
  path.remove()
}
const parseImports = ({ exportStats, id, imports, includeStatic }) => {
  return {
    ExportAllDeclaration(path) {
      const node = path.node
      if (node.source) {
        const moduleName = node.source.value
        const importer = {
          module: moduleName,
          members: [],
          replace: rewriteModule(moduleName)
        }
        importer.exportFromAll = true
        imports.push(importer)
        path.remove()
      }
    },
    ExportDefaultDeclaration(path) {
      const node = path.node
      exportStats.default = true

      // bug with babel templates when you use a function
      // call directly in the template

      if (node.declaration.id) {
        const name = node.declaration.id.name
        node.declaration.id = t.identifier(id)
        path.replaceWith(node.declaration)
        const Program = path.findParent(path => path.node.type === 'Program')
        replaceVariables(name, id, Program)
      } else {
        const tmp = variable({
          name: t.identifier(id),
          source: t.identifier(id)
        })
        tmp.declarations[0].init = node.declaration
        path.replaceWith(tmp)
      }
    },
    ExportNamedDeclaration(path) {
      const node = path.node

      if (node.source) {
        const moduleName = node.source.value
        const importer = {
          module: moduleName,
          members: [],
          replace: rewriteModule(moduleName)
        }
        imports.push(importer)
        node.specifiers.forEach(node => {
          if (node.type === 'ExportSpecifier') {
            const name = node.local.name
            if (name === 'default' && name === node.exported.name) {
              path.insertBefore(
                variable({
                  name: t.identifier(id),
                  source: t.identifier(rewriteModule(moduleName))
                })
              )
              importer.default = true
              exportStats.default = true
            } else {
              importer.members.push(name)

              path.insertBefore(
                variable({
                  name: t.identifier(id + '_' + node.exported.name),
                  source: t.identifier(rewriteModule(moduleName, name))
                })
              )

              exportStats.export.push(node.exported.name)
            }
          }
        })
        path.remove()
      } else {
        const Program = path.findParent(path => path.node.type === 'Program')

        if (node.specifiers.length === 0 && node.declaration) {
          let name = node.declaration.declarations

          if (!node.declaration.declarations) {
            name = node.declaration.id.name
          } else {
            name = node.declaration.declarations[0].id.name
          }
          path.replaceWith(node.declaration)
          exportStats.export.push(name)

          replaceVariables(name, id + '_' + name, Program)
        } else {
          node.specifiers.forEach(node => {
            if (node.exported.name !== node.local.name) {
              path.insertBefore(
                variable({
                  name: t.identifier(id + '_' + node.exported.name),
                  source: t.identifier(node.local.name)
                })
              )
            }
            replaceVariables(
              node.exported.name,
              id + '_' + node.exported.name,
              Program
            )
            exportStats.export.push(node.exported.name)
          })
          path.remove()
        }
      }
    },
    ImportDeclaration(path) {
      parseImportDeclaration(path.node, imports, path)
    }
  }
}

module.exports = parseImports
