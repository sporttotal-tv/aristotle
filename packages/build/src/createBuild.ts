import { build as esbuild } from 'esbuild'
import plugins from './plugins'
import { BuildOpts } from './'

const createBuild = async (
  { gzip, production, cssReset, ...opts }: BuildOpts,
  watch
) => {
  const meta = {
    css: {},
    fileCache: {},
    paths: new Set(),
    dependencies: {},
    errors: []
  }
  const define = {
    'process.env.NODE_ENV': production ? '"production"' : '"dev"',
    ...opts.define
  }
  if (opts.platform !== 'node') {
    // @ts-ignore
    define.global = 'window'
  }
  // @ts-ignore
  const result = await esbuild({
    bundle: true,
    outdir: 'out',
    incremental: watch,
    metafile: watch ? 'meta.json' : undefined,
    publicPath: '/',
    target: 'es6',
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
    define,
    plugins: [plugins(opts, meta)],
    write: false
  }).catch(e => e)

  return { result, meta }
}

export default createBuild
