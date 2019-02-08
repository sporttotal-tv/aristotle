const path = require('path')
const {
  startServer
  // store,
  // build,
  // buildProduction,
  // production
} = require('../lib')
const fs = require('mz/fs')

// store.noCache = true

startServer(path.join(__dirname, './projects/reactNativeWeb/index.js'), 3002)
// startServer(path.join(__dirname, './projects/treeShake/index.js'), 3002)
