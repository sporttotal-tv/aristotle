import { buildProduction } from '../lib'
import test from 'ava'
import path from 'path'

test('node.js production', async t => {
  console.log('lets build a node js project...')

  try {
    const result = await buildProduction(
      path.join(__dirname, '/projects/node/index.js'),
      'node'
    )
    console.log('hello::', result.node)
  } catch (err) {
    console.log(err)
  }

  t.pass()
})
