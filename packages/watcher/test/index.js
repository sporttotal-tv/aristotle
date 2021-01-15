const createServer = require('../dist').default
const { join } = require('path')

const target = join(__dirname, 'myapp.tsx')

createServer({
  port: 9999,
  target
})
