const createServer = require('../dist').default
const { join } = require('path')

createServer({
  port: 9999,
  file: join(__dirname, 'myapp.ts')
})
