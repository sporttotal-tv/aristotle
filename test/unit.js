import { parseFile, build, startServer } from '../lib'
import test from 'ava'
import path from 'path'
import fs from 'mz/fs'

// test('parseFile', async t => {
// 	console.log('parseFile')
// 	const file = await parseFile(
// 		path.join(__dirname, '/projects/simple/index.js')
// 	)
// 	console.log('hello::', file)
// 	t.pass()
// })

// test('file does not exist', async t => {
// 	const file = await parseFile(path.join(__dirname, '/projects/nonExisting'))
// 	t.truthy(file.error)
// 	t.pass()
// })

// test('cannot resolve when no package.json', async t => {
// 	await t.throwsAsync(async () => parseFile('/flapflap/'))
// 	t.pass()
// })

// test('simple build', async t => {
// 	const result = await build(path.join(__dirname, '/projects/simple/index.js'))

// 	// console.log('???', result)
// 	// t.truthy(result)
// 	t.pass()
// })

test('simpleDynamicImports', async t => {
  const result = await build(
    path.join(__dirname, '/projects/simpleDynamicImports/index.js')
  )

  console.log(
    // result.browserBundle.code,
    Object.keys(result.browserBundle.bundleMap)
  )

  for (let key in result.browserBundle.bundleMap) {
    await fs.writeFile(
      path.join(
        __dirname,
        '../dist/',
        result.browserBundle.bundleMap[key].codeHash + '.js'
      ),
      result.browserBundle.bundleMap[key].code
    )
    if (result.browserBundle.bundleMap[key].css) {
      await fs.writeFile(
        path.join(
          __dirname,
          '../dist/',
          result.browserBundle.bundleMap[key].cssHash + '.css'
        ),
        result.browserBundle.bundleMap[key].css
      )
    }
  }

  await fs.writeFile(
    path.join(__dirname, '../dist/test.js'),
    result.browserBundle.code
  )

  await fs.writeFile(
    path.join(__dirname, '../dist/test.css'),
    result.browserBundle.css
  )

  await fs.writeFile(
    path.join(__dirname, '../dist/node/test.js'),
    result.nodeBundle.code
  )
  t.pass()
})

// test('dynamicImports', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/dynamicimports/index.js')
// 	)

// 	console.log(
// 		result.browserBundle.code.length,
// 		Object.keys(result.browserBundle.bundleMap)
// 	)
// 	t.pass()
// })

// test('simpleImports', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/simpleImports/index.js')
// 	)
// 	t.pass()
// })

// test('simpleRequire', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/simpleRequire/index.js')
// 	)
// 	console.log('BROWSER RESULT:\n')
// 	console.log(result.browserBundle.code)
// 	t.pass()
// })

// test('cssFiles', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/cssFiles/index.js')
// 	)
// 	t.pass()
// })

// test('circulair', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/dynamicimports/index.js')
// 	)
// 	t.pass()
// })

// test.only('polyfills', async t => {
// 	const result = await build(
// 		path.join(__dirname, '/projects/polyfills/index.js')
// 	)
// 	t.pass()
// })

// test('alias', async t => {
// 	const result = await build(path.join(__dirname, '/projects/alias/index.js'))
// 	t.pass()
// })
