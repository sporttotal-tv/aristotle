import test from 'ava'
import build from '../../src'
import { join } from 'path'

test('watch', async t => {
  build(
    {
      entryPoints: [join(__dirname, 'app.ts')],
      platform: 'node',
      external: ['redis']
    },
    result => {
      console.log('DO IT!!', result)
    }
  )
})
