const createServer = require('../dist').default
const { join } = require('path')

const target = join(__dirname, 'myapp.ts')

createServer({
  port: 9999,
  target,
})
