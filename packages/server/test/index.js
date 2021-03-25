const createServerDist = require('@sporttotal/aristotle-create-server-dist')
const { join } = require('path')
const startServer = require('../')

const main = async () => {
  await createServerDist.default({
    target: join(__dirname, './project/src/index.ts'),
    dest: join(__dirname, 'dist'),
  })
}

main()
