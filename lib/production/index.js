const fs = require('mz/fs')
const { buildProduction } = require('./build')
const { join, sep } = require('path')
const fsExtra = require('fs-extra')
const chalk = require('chalk')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const createHtml = require('./createHtml')

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

  await fs.writeFile(join(dest, 'package.json'), JSON.stringify(pkg, false, 2))

  await fsExtra.emptyDir(join(dest, 'server'))

  await fs.writeFile(
    join(dest, 'server/files.json'),
    JSON.stringify(files, false, 2)
  )

  if (result.server) {
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
    await createHtml(files, result.server)
  )
}

exports.production = production
