const path = require('path')
const {
  startServer,
  store,
  build,
  buildProduction,
  production
} = require('../lib')
const fs = require('mz/fs')

// store.noCache = true

// build(path.join(__dirname, '/projects/fetch/index.js')).then(async val => {
//   await fs.writeFile(
//     path.join(__dirname, '../dist/', 'fun.js'),
//     val.nodeBundle.code
//   )
// })

// build(path.join(__dirname, '/projects/cjs/a.js')).then(async val => {
//   console.log(val.nodeBundle.code)
//   await fs.writeFile(
//     path.join(__dirname, '../dist/', 'fun.js'),
//     val.nodeBundle.code
//   )
// })

// build(path.join(__dirname, '../../ops-front-app/src/index.js')).then(
//   async val => {
//     await fs.writeFile(
//       path.join(__dirname, '../dist/', 'fun.js'),
//       val.nodeBundle.code
//     )

//     console.log(
//       Object.keys(store.files).filter(val => val.indexOf('Graphics') !== -1)
//     )
//   }
// )

// startServer(path.join(__dirname, '/projects/simpleServer/index.js'), 3000)

// startServer(
//   path.join(__dirname, '../../ops-front-app/src/index.js'),
//   3000,
//   true
// )

// startServer(path.join(__dirname, './projects/cjs/a.js'), 3000)

// startServer(path.join(__dirname, './projects/externalLibs/index.js'), 3000)
// startServer(path.join(__dirname, './projects/simpleImports/index.js'), 3000)

// buildProduction(path.join(__dirname, './projects/reactstyle/index.js')).then(
//   val => {
//     console.log('result fuckes', val.browserBundle.css)

//     for (let bundle in val.browserBundle.bundleMap) {
//       console.log(
//         '\n\n\n\n',
//         val.browserBundle.bundleMap[bundle].css,
//         val.browserBundle.bundleMap[bundle].min
//       )
//     }

//     console.log(val.server)
//   }
// )

// production(
//   path.join(__dirname, './projects/redux/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))

// production(
//   path.join(__dirname, './projects/externalLibs/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))

// production(
//   path.join(__dirname, './projects/deadCode/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))

// startServer(path.join(__dirname, './projects/reactStyle/index.js'), 3000)

// production(
//   path.join(__dirname, './projects/reactStyle/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))
// store.noCache = true

// production(
//   path.join(__dirname, '../../ops-front-app/src/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))

// production(
//   path.join(__dirname, '/projects/ua/index.js'),
//   path.join(__dirname, '../dist')
// ).then(val => console.log('done'))

// startServer(path.join(__dirname, './projects/special/index.js'), 3002)

// startServer(path.join(__dirname, './projects/errors/syntaxError.js'), 3002)

// startServer(path.join(__dirname, './projects/reactcolor/index.js'), 3002)

// startServer(path.join(__dirname, '../../ops-front-app/src/index.js'), 3000)

// startServer(path.join(__dirname, './projects/attr/index.js'), 3002)
// buildProduction(path.join(__dirname, './projects/reactStyle/index.js')).then(
//   async val => {
//     console.log(Object.keys(val))
//     // console.log(val.browserBundle.min)
//   }
// )

// production(
//   path.join(__dirname, '../../../flowmatik/flowmatik/src/index.js'),
//   path.join(__dirname, '../dist'),
//   { minify: true }
// ).then(val => console.log('done'))

// startServer(
//   path.join(__dirname, '../../../flowmatik/flowmatik/src/index.js'),
//   3000
// )

// startServer(path.join(__dirname, './projects/webpack/index.js'), 3000)

// startServer(path.join(__dirname, './projects/module/index.js'), 3000)

// startServer(path.join(__dirname, './projects/alias/index.js'), 3002)

// startServer(path.join(__dirname, './projects/errors/syntaxError.js'), 3002)
// startServer(path.join(__dirname, './projects/reactStyle/index.js'), 3002)

// startServer(path.join(__dirname, './projects/reactStyle/index.js'), 3000)

startServer(path.join(__dirname, './projects/samename/index.js'), 3002)

// startServer(path.join(__dirname, '../../v2/apps/app/index.web.js'), 3002)
