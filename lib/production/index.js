const fs = require('mz/fs')
const { buildProduction } = require('./build')
const { join, resolve, dirname } = require('path')
const fsExtra = require('fs-extra')
const chalk = require('chalk')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const createHtml = require('./createHtml')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const production = async ({
  store,
  path,
  dest,
  type,
  minify,
  compressImages,
  treeshake,
  prerender
}) => {
  console.log(
    chalk.magenta(`+ Creating ouput directory "${dest}" treeshake ${treeshake}`)
  )
  await fsExtra.emptyDir(dest)

  const result = await buildProduction({ store, path, type, minify, treeshake })

  const { browserBundle } = result

  await fs.writeFile(
    join(dest, `${browserBundle.codeHash}.js`),
    browserBundle.min
  )
  await fs.writeFile(
    join(dest, `${browserBundle.codeHash}.js.es5`),
    browserBundle.minEs2015
  )
  await fs.writeFile(
    join(dest, `${browserBundle.cssHash}.css`),
    browserBundle.css
  )

  const files = {
    js: {
      path: `/${browserBundle.codeHash}.js`,
      contents: browserBundle.min
    },
    css: {
      path: browserBundle.css ? `/${browserBundle.cssHash}.css` : '',
      contents: browserBundle.css
    },
    es5: {
      path: `/${browserBundle.codeHash}.js.es5`,
      contents: browserBundle.minEs2015
    }
  }

  if (browserBundle.envFile) {
    files.env = {
      path: `/env.json`,
      contents: JSON.stringify(browserBundle.envFile)
    }
    await fs.writeFile(join(dest, `env.json`), files.env.contents)
  }

  for (const key in browserBundle.bundleMap) {
    const bundle = browserBundle.bundleMap[key]
    files[key] = {
      path: `/${bundle.codeHash}.js`,
      contents: bundle.min
    }
    files[key + 'es5'] = {
      path: `/${bundle.codeHash}.js.es5`,
      contents: bundle.minEs2015
    }
    await fs.writeFile(join(dest, `${bundle.codeHash}.js`), bundle.min)
    await fs.writeFile(
      join(dest, `${bundle.codeHash}.js.es5`),
      bundle.minEs2015
    )

    if (bundle.css) {
      files[key + '_css'] = {
        path: `/${bundle.cssHash}.css`,
        contents: bundle.css
      }
      await fs.writeFile(join(dest, `${bundle.cssHash}.css`), bundle.css)
    }
  }

  if (result.ssl) {
    const sslFiles = await fs.readdir(result.ssl)
    const crt = sslFiles.find(v => /\.crt$/.test(v))
    const key = sslFiles.find(v => /\.key$/.test(v))
    if (key && crt) {
      files.crt = {
        contents: (await fs.readFile(join(result.ssl, crt))).toString()
      }
      files.key = {
        contents: (await fs.readFile(join(result.ssl, key))).toString()
      }
      console.log(chalk.blue('• SSL certificates'))
      console.log('  cert ', crt)
      console.log('  key  ', key)
    } else {
      console.error(
        chalk.red('please add a .crt and .key file for ssl support')
      )
    }
  }

  const pkgDir = browserBundle.file.resolved.pkgDir
  const topLevelFiles = await fs.readdir(pkgDir)

  if (compressImages) {
    for (const file of topLevelFiles) {
      if (file === 'public' || file === 'static') {
        const path = join(pkgDir, file)
        console.log(chalk.magenta(`+ Copy "${path}" to "${join(dest, file)}"`))

        await fs.mkdir(join(dest, file))

        await fsExtra.copy(path, join(dest, file), {
          filter: async (src, dest) => {
            if (/(\.jpg|\.png|\.jpeg|\.svg|\.gif)$/i.test(src)) {
              try {
                await imagemin([src], {
                  destination: dirname(dest),
                  use: [
                    imageminMozjpeg(),
                    imageminPngquant({ quality: '65-80' }),
                    imageminSvgo({
                      plugins: [{ removeViewBox: false }]
                    })
                  ]
                })
                console.log(chalk.white(`- Compressed "${src}"`))
              } catch (err) {
                console.log(chalk.red(`- Cannot compress "${src}"`))
                return true
              }
            } else {
              return src[0] !== '.'
            }
          }
        })
      }
    }
  }

  const prevPkg = browserBundle.file.pkg

  const pkg = {
    name: prevPkg.name,
    version: prevPkg.version,
    scripts: {
      start: 'node server/index.js'
    }
  }

  let pkgWritten = false

  await fsExtra.emptyDir(join(dest, 'server'))

  await fs.writeFile(
    join(dest, 'server/files.json'),
    JSON.stringify(files, false, 2)
  )

  if (result.server) {
    const nodeModules = result.server.store.nodeModules
    if (nodeModules.length) {
      let packages
      const findDeps = async () => {
        const dependencies = {}
        console.info(' - Exclude modules in node.js', nodeModules)
        for (const moduleName of nodeModules) {
          if (prevPkg.dependencies && prevPkg.dependencies[moduleName]) {
            dependencies[moduleName] = prevPkg.dependencies[moduleName]
          } else {
            if (!packages) {
              packages = Object.keys(result.server.store.files).filter(v =>
                /\package\.json$/.test(v)
              )
            }
            for (const path of packages) {
              const file = result.server.store.files[path]
              if (file.node && file.node.parsed.js) {
                const parsedPkg = file.node.parsed.js
                if (parsedPkg.dependencies) {
                  if (
                    parsedPkg.dependencies &&
                    parsedPkg.dependencies[moduleName]
                  ) {
                    dependencies[moduleName] =
                      parsedPkg.dependencies[moduleName]
                    break
                  }
                }
              }
            }
          }
        }
        return dependencies
      }
      const dependencies = await findDeps()
      pkg.dependencies = dependencies
      await fs.writeFile(
        join(dest, 'package.json'),
        JSON.stringify(pkg, false, 2)
      )
      pkgWritten = true
      console.log('NPM install', dependencies)
      // timeout?
      try {
        const { stderr } = await exec(
          `cd ${dest} && npm install --loglevel=error --no-package-lock`
        )
        if (stderr) {
          console.log(stderr)
        }
      } catch (err) {
        console.log('error exec npm install')
      }
      console.log('Done npm install')
    }

    if (!pkgWritten) {
      await fs.writeFile(
        join(dest, 'package.json'),
        JSON.stringify(pkg, false, 2)
      )
    }

    await fs.writeFile(
      join(dest, `server/server.js`),
      `${result.server.min}\nmodule.exports = ${result.server.id}`
    )
  } else {
    await fs.writeFile(
      join(dest, 'server/server.js'),
      (await fs.readFile(join(__dirname, '../server/default.js'))).toString()
    )
  }

  await fs.writeFile(
    join(dest, 'server/index.js'),
    (
      await fs.readFile(join(__dirname, '../server/productionInline/index.js'))
    ).toString()
  )

  if (prerender) {
    console.log('start writing html')
    try {
      await fs.writeFile(
        join(dest, 'index.html'),
        await createHtml(files, result.server, join(resolve(dest), 'server'))
      )
    } catch (err) {
      console.log('error writing index.html')
    }
  }
}

exports.production = production
