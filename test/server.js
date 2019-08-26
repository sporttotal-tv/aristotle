const path = require('path')
const { startServer } = require('../lib')

// store.noCache = true

startServer(path.join(__dirname, './projects/simpleServer/index.js'), 3002)
