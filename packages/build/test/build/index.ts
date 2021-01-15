import test from 'ava'
import build from '../../src'
import { join } from 'path'

test('build', async t => {
  const { files, dependencies } = await build({
    entryPoints: [join(__dirname, 'app.tsx')],
    platform: 'node',
    external: ['redis'],
    sourcemap: true
  })

  t.truthy(dependencies.redis)
  t.is(Object.keys(files).length, 5)
})
