const Result = require('./result')
const { parseFile } = require('../file')
const { createBundle } = require('./createBundle')
const fs = require('mz/fs')
const chalk = require('chalk')
const { dirname, join } = require('path')
const { logError } = require('../util/log')
const treeShake = require('./code/treeshake')
const { es2015 } = require('../file/js/ast')
const { isJson, isCss } = require('../util/file')

// const importAll = path =>

const parseTree = async props => {
  // here we want to store 'used' fields
  const { type, tree, path, store } = props

  if (!tree.shake) {
    tree.shake = {}
  }
  if (!tree.shake[type]) {
    tree.shake[type] = {}
  }

  if (path) {
    if (!tree[type][path]) {
      tree.cnt++
      try {
        const file = await parseFile(props)

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
              for (let key in a.members) {
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

        tree[type][path] = file
        if (!tree[type]._start) {
          tree[type]._start = file
        }
        const dependencies = file[type].dependencies || []

        dependencies.forEach(val => {
          const isR =
            val.path ===
            '/Users/jim/saulx/v2/packages/ui-components/node_modules/react-native-web/dist/cjs'

          const shake = tree.shake[type]
          if (!shake[val.path]) {
            shake[val.path] = { members: {} }
          }
          const shakeit = shake[val.path]

          if (val.type === 'import') {
            if (val.default) {
              shakeit.default = true
            }

            if (val.all) {
              shakeit.all = true
            } else {
              val.members.forEach(v => {
                shakeit.members[v] = true
              })

              if (isR) {
                // console.log(val.path, shakeit, type)
              }
            }
          } else if (val.type === 'require') {
            shakeit.all = val.all || val.default
            if (!shakeit.all) {
              val.members.forEach(v => {
                shakeit.members[v] = true
              })
            }
          }
          // =======================

          parseTree({ ...props, path: val.path })
        })
      } catch (err) {
        console.log('cannot find file', path, err)
      }
      tree.cnt--
      if (!tree.cnt) {
        // console.log(tree.shake)
        // if tree shake make new files for each thing that can be shaked

        // for

        // tree.shake.browser

        // for (let key in tree.shake.browser) {
        //   // console.log(tree.browser, key)

        //   let file = tree.browser[key]

        //   if (!file) {
        //   } else {
        //     // console.log('ok got it', file)
        //     // es2015 , code
        //     const c = treeShake(
        //       file.browser.parsed.code,
        //       file.browser.parsed.id,
        //       tree.shake.browser[key]
        //     )

        //     file.browser.parsed.code = c
        //   }
        //   // treeShake(tree.shake.browser[key], tree.shake.browser[key])
        // }

        // console.log(tree)

        const treeShaked = {}

        const goTroughDeps = (file, path, isStart) => {
          const x = treeShaked[path] || treeShaked[file.path]
          if (x) {
            return x
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
            if (file.id === '$11nwfyq') {
              console.log('xxxxxxx', file.path, tree.shake.browser[file.path])
              // const x = []
              // for (let key in tree.shake.browser) {
              //   if (!tree.shake.browser[key].all) {
              //     x.push(key)
              //   }
              // }
              // console.log(x)
              // for (let key in file.resolved) {
              //   console.log(file.resolved[key])
              //   console.log(tree.shake.browser[file.resolved[key]])
              // }
            }

            if (
              tree.shake.browser[file.path] &&
              !tree.shake.browser[file.path].all
            ) {
              const c = treeShake(
                file.browser.parsed.code,
                file.browser.parsed.id,
                tree.shake.browser[file.path]
              )
              r.browser.parsed.code = c
              // r.browser.parsed.es2015 = es2015(c)
              file.browser.dependencies.forEach(d => {
                if (
                  d.type !== 'static' &&
                  c.indexOf(d.replace) === -1 &&
                  !(isJson(d.path) || isCss(d.path))
                ) {
                  console.log('REMOVE MODULE FROM TREESHAKING', d.path)
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
            // console.log(val)
            // tree.browser

            const f = tree.browser[val.path] || store.files[val.path]

            // if (!f) {
            //   console.log('WTF', val.path, val)
            // }

            goTroughDeps(f, val.path)
          })
        }

        if (process.env.NODE_ENV === 'production') {
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

        tree.done()
      }
    }
  }
}

const createTrees = async (props, tree) => {
  if (!props.type) {
    const folder = dirname(props.path)
    const files = await fs.readdir(folder)
    const server = files.find(val => val === 'server' || val === 'server.js')

    if (server) {
      const serverPath = join(
        folder,
        server === 'server' ? 'server/index.js' : server
      )
      tree.hasServer = true
      parseTree({ ...props, path: serverPath, type: 'node', tree })
    } else {
      parseTree({ ...props, type: 'node', tree })
    }

    parseTree({ ...props, type: 'browser', tree })
  } else {
    parseTree({ ...props, tree })
  }
}

const logErrors = result => {
  if (Object.keys(result.errors).length) {
    for (let key in result.errors) {
      logError(
        (result.errors[key].content && result.errors[key].content.node.raw) ||
          '',
        result.errors[key].error,
        result.errors[key]
      )
    }
  }
}

const collectErrors = result => {
  if (result.browserBundle) {
    for (let key in result.browserBundle.bundleMap) {
      if (result.browserBundle.bundleMap[key].errors) {
        result.errors = Object.assign(
          result.errors,
          result.browserBundle.bundleMap[key].errors
        )
      }
    }
  }
}

const build = props =>
  new Promise((resolve, reject) => {
    const tree = {
      node: {},
      browser: {},
      store: props.store,
      ids: {},
      cnt: 0,
      done: async () => {
        const result = new Result()
        if (!props.type) {
          result.nodeBundle = await createBundle({
            ...props,
            file: tree.node._start,
            type: 'node'
          })
          if (result.nodeBundle.errors) {
            result.errors = Object.assign(
              result.errors,
              result.nodeBundle.errors
            )
          }

          result.browserBundle = await createBundle({
            ...props,
            store: { files: tree.browser },
            file: tree.browser._start,
            type: 'browser'
          })
          if (result.browserBundle.errors) {
            result.errors = Object.assign(
              result.errors,
              result.browserBundle.errors
            )
          }
        } else {
          result[props.type + 'Bundle'] = await createBundle({
            ...props,
            // store: tree[props.type],
            file: tree[props.type]._start
          })

          if (result[props.type + 'Bundle'].errors) {
            result.errors = Object.assign(
              result.errors,
              result[props.type + 'Bundle'].errors
            )
          }
        }

        if (tree.hasServer) {
          result.server = result.nodeBundle
        }

        collectErrors(result)

        logErrors(result)

        resolve(result)
      }
    }

    if (process.env.NODE_ENV === 'production') {
      console.log(chalk.magenta('\nNODE_ENV IS PRODUCTION'))
    }

    createTrees(props, tree)
  })

exports.build = build
