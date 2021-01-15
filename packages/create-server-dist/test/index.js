const createServer = require('../')
// this just calls the funciton on the folder (and clears it)

const { join } = require('path')

createServer.default({
  target: join(__dirname, './project/src/index.ts'),
  dest: join(__dirname, './dist')
})
