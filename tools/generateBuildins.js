const builtinModules = require('builtin-modules')
const { join } = require('path')
const target = join(__dirname, '../lib/file/builtin')
const fs = require('mz/fs')
// const npmExists = require('npm-exists')
// const chalk = require('chalk')
// const check = require('npm-check-latest')

const run = async () => {
	const obj = {}

	builtinModules.forEach(val => {
		const key = `./lib/file/builtin/${val}/index.js`
		obj[key] = `./lib/file/builtin/${val}/browser.js`
	})

	const pkg = JSON.parse(
		(await fs.readFile(join(__dirname, '../package.json'))).toString()
	)

	Object.assign(pkg.browser, obj)

	console.log('updated browser fallbacks for builtin')

	console.log('finding polyfills')

	const fallback = {}
	// for (let builtin of builtinModules) {
	// 	const browserifyFallback = builtin + '-browserify'
	// 	const exists = await npmExists(browserifyFallback)
	// 	if (exists) {
	// 		const version = await check({ [browserifyFallback]: '0.0.0' })
	// 		console.log(chalk.green('found'), browserifyFallback, version[0].latest)
	// 		fallback[browserifyFallback] = version[0].latest
	// 	} else {
	// 		console.log('no fallback for', builtin)
	// 	}
	// }

	Object.assign(pkg.dependencies, fallback)

	console.log('updating pkg')

	await fs.writeFile(
		join(__dirname, '../package.json'),
		JSON.stringify(pkg, false, 2)
	)

	console.log('write files')
	for (let builtin of builtinModules) {
		const browserifyFallback = builtin + '-browserify'
		const browser = fallback[browserifyFallback]
			? `module.exports = require('${browserifyFallback}')`
			: `console.warning('${builtin} not supported in the browser')`
		const node = `module.exports = require('${builtin}')`
		await fs.mkdir(join(target, builtin))
		await fs.writeFile(join(target, builtin, 'index.js'), node)
		await fs.writeFile(join(target, builtin, 'browser.js'), browser)
	}

	console.log('done!')
}

run()
