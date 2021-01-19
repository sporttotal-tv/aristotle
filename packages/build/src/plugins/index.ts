import fs from 'fs'
import parseStyle from './style'
import getPkg from '@saulx/get-package'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminSvgo from 'imagemin-svgo'

export default (opts, meta) => {
  meta.styleCnt = 0
  const plugin = {
    name: 'aristotle',
    setup(build) {
      // store all paths for watching
      build.onLoad({ filter: /.*/, namespace: 'file' }, async ({ path }) => {
        meta.paths.add(path)
      })

      // parse and transform styles
      build.onLoad(
        { filter: /\.tsx$|\.jsx$/, namespace: 'file' },
        async ({ path }) => {
          if (!(path in meta.fileCache)) {
            try {
              const text = await fs.promises.readFile(path, 'utf8')
              const contents = parseStyle(text, meta)
              meta.fileCache[path] = { contents, loader: 'tsx' }
            } catch (e) {
              console.error('error parsing style', e)
              return
            }
          }
          return meta.fileCache[path]
        }
      )

      if (opts.external) {
        // store dependencies
        build.onResolve(
          { filter: new RegExp(opts.external.join('|')) },
          async args => {
            if (!(args.path in meta.dependencies)) {
              try {
                // try to get the installed version
                const contents = await fs.promises.readFile(
                  require.resolve(`${args.path}/package.json`, {
                    paths: [args.resolveDir]
                  }),
                  'utf-8'
                )
                meta.dependencies[args.path] = JSON.parse(contents).version
              } catch (e) {
                // get the version from the dependencies
                const pkg = await getPkg(args.resolveDir)
                meta.dependencies[args.path] =
                  pkg.dependencies[args.path] || '*'
              }
            }
          }
        )
      }

      if (opts.minify) {
        // minify images
        build.onLoad(
          { filter: /(\.jpg|\.png|\.jpeg|\.svg|\.gif)$/, namespace: 'file' },
          async ({ path }) => {
            if (!(path in meta.fileCache)) {
              try {
                const { data } = await imagemin([path], {
                  use: [
                    imageminMozjpeg(),
                    imageminPngquant({ quality: [65, 80] }),
                    imageminSvgo({
                      plugins: [{ removeViewBox: false }]
                    })
                  ]
                })
                meta.fileCache[path] = { contents: data, loader: 'file' }
              } catch (e) {
                return
              }
            }
            return meta.fileCache[path]
          }
        )
      }
    }
  }
  return plugin
}
