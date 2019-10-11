const path = require('path')
const { startServer, store, production } = require('../lib')

store.noCache = true

// process.env.NODE_ENV = 'production'
// production(path.join(__dirname, '../../v2/apps/app/index.js'), './dist')

// startServer(, 3002)
// startServer(path.join(__dirname, '../../v2/apps/app/index.js'), 3002)
// startServer(path.join(__dirname, './projects/redis/index.js'), 3002)
// production(path.join(__dirname, './projects/x/index.js'), './dist')
// startServer(path.join(__dirname, './projects/reactNativeWeb/index.js'), 3002)

production(path.join(__dirname, './projects/redis/index.js'), './dist')

// also check murmur hash after this
// startServer(path.join(__dirname, './projects/sectionList/index.js'), 3002)
// production(path.join(__dirname, './projects/reactStyle/index.js'), './dist')
// startServer(path.join(__dirname, './projects/treeShake/index.js'), 3002)
// startServer(path.join(__dirname, './projects/events/index.js'), 3002)
// startServer(path.join(__dirname, './projects/color/index.js'), 3002)
// startServer(path.join(__dirname, './projects/color/index.js'), 3002)
