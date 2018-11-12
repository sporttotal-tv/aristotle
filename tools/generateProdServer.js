const path = require('path')
const { buildProduction } = require('../lib')
const fs = require('mz/fs')

buildProduction(
  path.join(__dirname, '../lib/server/production.js'),
  'node',
  true
).then(async val => {
  await fs.writeFile(
    path.join(__dirname, '../lib/server/productionInline/index.js'),
    val.nodeBundle.min
  )
  console.log('succesfully generated inline prod server')
})
