const treeShake = require('./ast')
const { es2015 } = require('../../file/js/ast')
const { isJson, isCss } = require('../../util/file')

exports.filterModules = (tree, store, treeshake) => {
  const treeShaked = {}
  const goTroughDeps = (file, path, isStart, from) => {
    if (!file) {
      console.error('Cannot find file', path)
      return
    }

    if (treeShaked[file.path]) {
      if (!treeShaked[path]) {
        // console.log('---------------------------------')
        // console.log(path, '--->', file.path)
        // console.log('---------------------------------')
        treeShaked[path] = treeShaked[file.path]
      }
      return
    }
    const r = { ...file }

    r.browser = {
      dependencies: [],
      parsed: {
        ...file.browser.parsed,
        code: file.browser.parsed.code,
        es2015: file.browser.parsed.es2015
      }
    }
    r.id = file.id
    r.pkg = file.pkg
    if (!isStart) {
      if (tree.shake.browser[file.path] && !tree.shake.browser[file.path].all) {
        const c = treeShake(
          file.browser.parsed.code,
          file.browser.parsed.id,
          tree.shake.browser[file.path],
          file.browser,
          file
        )

        r.browser.parsed.treeShakedMembers = tree.shake.browser[file.path]
        r.browser.parsed.code = c
        r.browser.parsed.es2015 = es2015(c)
        file.browser.dependencies.forEach(d => {
          if (
            d.type !== 'static' &&
            c.indexOf(d.replace) === -1 &&
            !(isJson(d.path) || isCss(d.path))
          ) {
            // cookie
          } else {
            r.browser.dependencies.push(d)
          }
        })
      } else {
        // console.log('ALL DO NOTHING')
        r.browser.dependencies = file.browser.dependencies
      }
    } else {
      r.browser.dependencies = file.browser.dependencies
      treeShaked._start = r
    }

    treeShaked[path] = treeShaked[file.path] = r

    const dependencies = r.browser.dependencies

    dependencies.forEach(val => {
      const f = store.files[val.path]
      goTroughDeps(f, val.path, false, r)
    })
  }

  if (
    process.env.NODE_ENV === 'production' &&
    tree.browser &&
    tree.browser._start &&
    treeshake === true
  ) {
    console.log('TREESHAKE IMPORTS')
    goTroughDeps(
      tree.browser._start,
      tree.browser._start.resolved.browser,
      true
    )
    console.log('====================')
    console.log(
      'Removed ',
      Object.keys(tree.browser).length - Object.keys(treeShaked).length,
      ' modules'
    )
    tree.browser = treeShaked
  }
}

exports.collectImports = (tree, type, val) => {
  // /Users/jim/saulx/v2/apps/cms/node_modules/react-redux/es/utils/Subscription.js

  const shake = tree.shake[type]
  if (!shake[val.path]) {
    shake[val.path] = { members: {} }
  }
  const shakeit = shake[val.path]
  if (val.type === 'dynamic') {
    shakeit.default = true
    // console.log('DYNAMIC', val)
    if (val.type === 'dynamic') {
      shakeit._dyn = true
    }
  } else if (val.type === 'import') {
    if (val.default) {
      shakeit.default = true
    }
    if (val.all) {
      shakeit.all = true
    } else {
      val.members.forEach(v => {
        shakeit.members[v] = true
      })
    }
  } else if (val.type === 'require') {
    shakeit.all = val.all || val.default
    if (!shakeit.all) {
      val.members.forEach(v => {
        shakeit.members[v] = true
      })
    }
  } else if (val.type === 'static') {
    shakeit.static = true
  }
}

exports.resolveImports = (tree, type, file, path) => {
  if (path !== file.path) {
    const a = tree.shake[type][path]
    const b = tree.shake[type][file.path]
    if (!a && !b) {
      tree.shake[type][path] = tree.shake[type][file.path] = {
        members: {}
      }
    } else if (a && b) {
      if (a !== b) {
        if (a.all) {
          b.all = true
        }
        if (a.default) {
          b.default = true
        }
        for (const key in a.members) {
          b.members[key] = true
        }
        tree.shake[type][path] = b
      }
    } else if (a && !b) {
      tree.shake[type][file.path] = a
    } else if (b) {
      tree.shake[type][path] = b
    }
  } else if (!tree.shake[type][file.path]) {
    tree.shake[type][file.path] = { members: {} }
  }
}
