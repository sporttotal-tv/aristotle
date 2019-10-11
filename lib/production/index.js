const fs = require('mz/fs')
const { buildProduction } = require('./build')
const { join, sep, resolve } = require('path')
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
  compressImages
}) => {
  console.log(chalk.magenta(`+ Creating ouput directory "${dest}"`))
  await fsExtra.emptyDir(dest)

  const result = await buildProduction({ store, path, type, minify })

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
  for (let key in browserBundle.bundleMap) {
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

  const pkgDir = browserBundle.file.resolved.pkgDir
  const topLevelFiles = await fs.readdir(pkgDir)

  if (compressImages) {
    for (let file of topLevelFiles) {
      if (file === 'public' || file === 'static') {
        const path = join(pkgDir, file)
        console.log(chalk.magenta(`+ Copy "${path}" to "${join(dest, file)}"`))
        await fsExtra.copy(path, join(dest, file), {
          filter: async (src, dest) => {
            if (/(\.jpg|\.png|\.jpeg|\.svg|\.gif)$/i.test(src)) {
              try {
                await imagemin(
                  [src],
                  dest
                    .split(sep)
                    .slice(0, -1)
                    .join(sep),
                  {
                    use: [
                      imageminMozjpeg(),
                      imageminPngquant({ quality: '65-80' }),
                      imageminSvgo({
                        plugins: [{ removeViewBox: false }]
                      })
                    ]
                  }
                )
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
            for (let path of packages) {
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
      pkg.dependencies = pkg.dependencies
      await fs.writeFile(
        join(dest, 'package.json'),
        JSON.stringify(pkg, false, 2)
      )
      pkgWritten = true
      console.log('NPM install', dependencies)
      const { stderr } = await exec(
        `cd ${dest} && npm install --loglevel=error --no-package-lock`
      )
      if (stderr) {
        console.log(stderr)
      }
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
    (await fs.readFile(
      join(__dirname, '../server/productionInline/index.js')
    )).toString()
  )

  await fs.writeFile(
    join(dest, 'index.html'),
    await createHtml(files, result.server, join(resolve(dest), 'server'))
  )
}

exports.production = production
