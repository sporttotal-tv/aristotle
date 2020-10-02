const path = require('path')
const { startServer, store, production } = require('../lib')

// store.cacheLocation = __dirname

store.noCache = true

// process.env.NODE_ENV = 'production'
// production(path.join(__dirname, '../../v2/apps/app/index.js'), './dist')

// startServer(, 3002)
// startServer(path.join(__dirname, '../../v2/apps/app/index.js'), 3002)
// startServer(path.join(__dirname, './projects/redis/index.js'), 3002)
// production(
//   path.join(__dirname, './projects/redis/index.js'),
//   path.join(__dirname, './projects/redis', 'dist')
// )
// production(
//   path.join(__dirname, './projects/redis2/index.js'),
//   path.join(__dirname, './projects/redis2', 'dist')
// )
// startServer(path.join(__dirname, './projects/reactNativeWeb/y.js'), 3002)

console.error('xxx')
production(path.join(__dirname, './projects/flurp/index.js'), './dist', {
  minify: false
})
  .then(v => {
    console.error('x', v)
  })
  .catch(v => {
    console.error('y', v)
  })

console.error('xxx')

// startServer(path.join(__dirname, './projects/treeShake/index.js'), 3002)

// production(path.join(__dirname, './projects/dynamicImports/index.js'), './dist')
// startServer(path.join(__dirname, './projects/datePicker/index.js'), 3002)

// startServer(path.join(__dirname, './projects/babelRuntime/index.js'), 3002)
// startServer(path.join(__dirname, './projects/webpack/index.js'), 3003)

// also check murmur hash after this
// startServer(path.join(__dirname, './projects/sectionList/index.js'), 3002)
// production(path.join(__dirname, './projects/reactStyle/index.js'), './dist')
// startServer(path.join(__dirname, './projects/reactNativeWeb/index.js'), 3002)
// startServer(path.join(__dirname, './projects/events/index.js'), 3002)
// startServer(path.join(__dirname, './projects/color/index.js'), 3002)
// startServer(path.join(__dirname, './projects/color/index.js'), 3002)
