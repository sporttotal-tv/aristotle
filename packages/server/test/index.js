const createServerDist = require('@saulx/aristotle-create-server-dist')
const { join } = require('path')
const startServer = require('../')

const main = async () => {
  await createServerDist.default({
    target: join(__dirname, './project/src/index.ts'),
    dest: join(__dirname, 'dist')
  })
  await startServer.default({
    port: 8888,
    buildJson: join(__dirname, 'dist', 'build.json')
  })
}

main()
