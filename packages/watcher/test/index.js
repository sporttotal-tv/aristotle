const createServer = require('../dist').default

createServer({
  port: 9999,
  file: 'x/flap'
})
