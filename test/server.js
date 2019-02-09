const path = require('path')
const {
  startServer,
  // store,
  // build,
  // buildProduction,
  production
} = require('../lib')
const fs = require('mz/fs')

// store.noCache = true

// process.env.NODE_ENV = 'production'
startServer(path.join(__dirname, '../../v2/apps/app/index.web.js'), 3002)

// startServer(path.join(__dirname, './projects/reactStyle/index.js'), 3002)
// startServer(path.join(__dirname, './projects/reactNativeWeb/index.js'), 3002)
// production(path.join(__dirname, './projects/reactNativeWeb/index.js'), './dist')
// startServer(path.join(__dirname, './projects/treeShake/index.js'), 3002)
