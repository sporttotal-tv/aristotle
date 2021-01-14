import test from 'ava'
import build from '../../src'
import { join } from 'path'

test('build', async t => {
  const r = await build({
    entryPoints: [join(__dirname, 'app.tsx')],
    platform: 'node',
    external: ['redis'],
    sourcemap: true
    // gzip: true,
    // minify: true,
    // splitting: true,
    // format: 'esm'
  })
  console.log(
    '-->',
    r.js[0].text.split('\n').find(v => /sourceMappingURL/.test(v))
  )
  console.log('files:', Object.keys(r.files))
})
