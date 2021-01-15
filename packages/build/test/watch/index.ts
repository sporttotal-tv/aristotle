import test from 'ava'
import build from '../../src'
import { join } from 'path'
import fs from 'fs'

test.serial('watch', async t => {
  const file = join(__dirname, 'change.ts')
  let cnt = 5
  t.plan(1)

  await new Promise(resolve =>
    build(
      {
        entryPoints: [file]
      },
      result => {
        if (result.errors.length) {
          t.fail()
        }
        if (cnt) {
          fs.promises.writeFile(file, `console.log('hello ${cnt--}')`)
        } else {
          resolve(result)
        }
      }
    )
  )

  t.pass()
})

test.serial('watch error', async t => {
  const file = join(__dirname, 'error.ts')
  let cnt = 5
  t.plan(1)

  await new Promise(resolve =>
    build(
      {
        entryPoints: [file]
      },
      result => {
        if (!result.errors.length) {
          t.fail()
        }
        if (cnt) {
          fs.promises.writeFile(file, `import ${cnt--}`)
        } else {
          resolve(result)
        }
      }
    )
  )

  t.pass()
})
