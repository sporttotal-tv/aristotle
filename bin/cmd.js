#!/usr/bin/env node
const { isAbsolute, join } = require('path')
const { startServer, production } = require('../') // dev server
const { isDir } = require('../lib/util/file')
const cwd = process.cwd()
const program = require('commander')
const findPort = require('../lib/util/port')

console.log('aristotle!')

program
  .option('-p, --port <port>', 'Port')
  .option('--no-treeshake', 'no tree shake')
  .option('--no-minify', 'no minify')
  .parse(process.argv)

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
  program.parse(process.argv)
  port = await findPort(port)
  startServer(input, port)
}

if (dest) {
  const { treeshake, minify } = program
  const output = isAbsolute(dest) ? dest : join(cwd, dest)
  production(input, output, { treeshake, minify })
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
