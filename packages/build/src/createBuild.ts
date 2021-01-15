import { build as esbuild } from 'esbuild'
import plugins from './plugins'

const createBuild = async ({ gzip, production, cssReset, ...opts }, watch) => {
  const files = { css: {}, fileCache: {}, paths: new Set() }
  const dependencies = {}
  const result = await esbuild({
    bundle: true,
    outdir: 'out',
    incremental: watch,
    metafile: watch ? 'meta.json' : undefined,
    publicPath: '/',
    ...opts,
    loader: {
      '.woff': 'file',
      '.woff2': 'file',
      '.jpg': 'file',
      '.png': 'file',
      '.jpeg': 'file',
      '.svg': 'file',
      '.gif': 'file',
      ...opts.loader
    },
    define: {
      global: 'window',
      'process.env.NODE_ENV': production ? '"production"' : '"dev"',
      ...opts.define
    },
    plugins: [plugins(opts, files, dependencies)],
    write: false
  }).catch(e => e)

  return { result, files, dependencies }
}

export default createBuild
