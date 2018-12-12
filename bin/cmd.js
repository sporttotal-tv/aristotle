#!/usr/bin/env node
const { isAbsolute, join } = require('path')
const { startServer, production } = require('../') // dev server
const { isDir } = require('../lib/util/file')
const cwd = process.cwd()
const program = require('commander')
const findPort = require('../lib/util/port')
const file = process.argv[2]
const dest = process.argv[3]

var input = isAbsolute(file) ? file : join(cwd, file)

if (isDir(input)) {
  input += '/index.js'
}

const startDev = async () => {
  var port = 3000
  program.option('-p, --port <port>', 'Use port').action((cmd, options) => {
    if (options.port) port = options.port
  })
  program.parse(process.argv)
  port = await findPort(port)
  startServer(input, port)
}

if (dest && dest[0] !== '-') {
  const output = isAbsolute(dest) ? dest : join(cwd, dest)
  production(input, output, {})
    .then(val => {
      process.exit()
    })
    .catch(e => {
      console.log(e)
      process.exit()
    })
} else {
  startDev()
}
