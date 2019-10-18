const Result = require('./result')
const { parseFile } = require('../file')
const { createBundle } = require('./createBundle')
const fs = require('mz/fs')
const chalk = require('chalk')
const { dirname, join } = require('path')
const { logError } = require('../util/log')
const { filterModules, collectImports, resolveImports } = require('./treeshake')

const parseTree = async props => {
  const { type, tree, path, store } = props
  if (path) {
    if (!tree[type][path]) {
      tree.cnt++
      try {
        const file = await parseFile(props)
        // console.log('need to do more)
        resolveImports(tree, type, file, path)
        tree[type][path] = file
        if (!tree[type]._start) {
          tree[type]._start = file
        }
        const dependencies = file[type].dependencies || []
        dependencies.forEach(val => {
          collectImports(tree, type, val)
          parseTree({ ...props, path: val.path })
        })
      } catch (err) {
        console.log('cannot find file', path, err)
      }
      tree.cnt--
      if (!tree.cnt) {
        filterModules(tree, store)
        tree.done()
      }
    }
  }
}

const createTrees = async (props, tree) => {
  if (!props.type) {
    const folder = dirname(props.path)
    const files = await fs.readdir(folder)

    // so we want to find ssl

    const hasSsl = files.indexOf('ssl') !== -1

    if (hasSsl) {
      tree.ssl = join(folder, 'ssl')
    }

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
    for (const key in result.errors) {
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
    for (const key in result.browserBundle.bundleMap) {
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
      shake: {
        node: {},
        browser: {}
      },
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
            store: { ...props.store, files: tree.browser },
            file: tree.browser._start,
            type: 'browser'
          })

          // console.log(Object.keys(result.browserBundle.traversed))
          // console.log(Object.keys(result.browserBundle.bundles))

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

        if (tree.ssl) {
          result.ssl = tree.ssl
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
