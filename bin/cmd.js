#!/usr/bin/env node
const { isAbsolute, join } = require('path')
const { startServer, production } = require('../') // dev server
const { isDir } = require('../lib/util/file')
const cwd = process.cwd()
const program = require('commander')
const isPortFree = require('is-port-free')

// const dev = ~process.argv.indexOf('-d') || ~process.argv.indexOf('--dev')

const file = process.argv[2]
const dest = process.argv[3]

var input = isAbsolute(file) ? file : join(cwd, file)

if (isDir(input)) {
  input += '/index.js'
}

const findPort = async port => {
  try {
    await isPortFree(port)
    return port
  } catch (notFree) {
    port = await findPort(++port)
    return port
  }
}

const startDev = async () => {
  var port = 3000
  program.option('-p, --port <port>', 'Use port').action((cmd, options) => {
    if (options.port) port = options.port
  })
  port = await findPort(port)
  program.parse(process.argv)
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
