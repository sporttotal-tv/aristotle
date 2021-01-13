import test from 'ava'
import build from '../../src'
import { join } from 'path'

test('wacth', async t => {
  const r = await build(
    {
      entryPoints: [join(__dirname, 'app.ts')],
      platform: 'node',
      external: ['redis']
    },
    result => {
      console.log('DO IT!!', result)
    }
  )
  console.log('ok also this:', r)
})
