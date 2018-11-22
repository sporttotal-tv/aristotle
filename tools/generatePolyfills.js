const path = require('path')
const { buildProduction } = require('../lib')
const fs = require('mz/fs')

buildProduction(
  path.join(__dirname, '../lib/file/static/polyfill/index.js'),
  void 0,
  true
).then(async val => {
  await fs.writeFile(
    path.join(__dirname, '../lib/build/code/polyfill.min.js'),
    val.browserBundle.min
  )
  console.log('succesfully generated inline polyfill')
})
