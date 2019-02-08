const Result = require('./result')
const { parseFile } = require('../file')
const { createBundle } = require('./createBundle')
const fs = require('mz/fs')
const chalk = require('chalk')
const { dirname, join } = require('path')
const { logError } = require('../util/log')
const treeShake = require('./code/treeshake')

const parseTree = async props => {
  // here we want to store 'used' fields
  const { type, tree, path } = props
  if (path) {
    if (!tree[type][path]) {
      tree.cnt++
      try {
        const file = await parseFile(props)

        tree[type][path] = file
        if (!tree[type]._start) {
          tree[type]._start = file
        }
        const dependencies = file[type].dependencies || []

        dependencies.forEach(val => {
          // members
          // default

          // if production make it tree shake
          if (!tree.shake) {
            tree.shake = {}
          }

          if (!tree.shake[type]) {
            tree.shake[type] = {}
          }

          const shake = tree.shake[type]

          if (!shake[val.path]) {
            shake[val.path] = { members: {} }
          }

          if (val.type === 'import') {
            if (val.default) {
              shake[val.path].default = true
            } else if (val.all) {
              shake[val.path].all = true
            } else {
              val.members.forEach(v => {
                shake[val.path].members[v] = true
              })
            }
          } else if (val.type === 'require') {
            // same as all
            // can be optmized later
            shake[val.path].all = true
          }

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

        for (let key in tree.shake.browser) {
          // console.log(tree.browser, key)

          let file = tree.browser[key]

          if (!file) {
          } else {
            // console.log('ok got it', file)
            // es2015 , code
            const c = treeShake(
              file.browser.parsed.code,
              file.browser.parsed.id,
              tree.shake.browser[key]
            )

            file.browser.parsed.code = c
          }
          // treeShake(tree.shake.browser[key], tree.shake.browser[key])
        }

        // console.log(tree)

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
