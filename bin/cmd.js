#!/usr/bin/env node
const { isAbsolute, join } = require('path')
const { startServer, production } = require('../') // dev server
const { isDir } = require('../lib/util/file')
const cwd = process.cwd()
const findPort = require('../lib/util/port')

const { program } = require('commander')
program.version('2.0.1')

program
  .option('-c, --cache <cache>', 'Cache location')
  .option('-p, --port <port>', 'Port')
  .option('--no-treeshake', 'No tree shake')
  .option('--no-minify', 'No minify')

program.parse(process.argv)

const args = program.args

const file = args[0]
const dest = args[1]

var input = isAbsolute(file) ? file : join(cwd, file)

if (isDir(input)) {
  input += '/index.js'
}

const startDev = async () => {
  var port = program.port ? program.port * 1 : 3000
  const cacheLocation = program.cache

  program.parse(process.argv)
  port = await findPort(port)
  startServer(input, port, { cacheLocation })
}

if (dest) {
  const cacheLocation = program.cache

  const { treeshake, minify } = program
  const output = isAbsolute(dest) ? dest : join(cwd, dest)
  production(input, output, { treeshake, minify, cacheLocation })
    .then(() => {
      process.exit()
    })
    .catch(e => {
      console.log(e.message)
      process.exit()
    })
} else {
  startDev()
}
