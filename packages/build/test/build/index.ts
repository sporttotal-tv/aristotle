import test from 'ava'
import build from '../../src'
import { join } from 'path'

test('build', async t => {
  const r = await build({
    entryPoints: [join(__dirname, 'app.ts')],
    platform: 'node',
    external: ['redis']
  })
  console.log('------>', r)
})
