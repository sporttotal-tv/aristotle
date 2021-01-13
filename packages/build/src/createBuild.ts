import { build as esbuild } from 'esbuild'
import plugins from './plugins'

const createBuild = async ({ gzip, production, ...opts }, watch) => {
  const styles = { css: {}, fileCache: {} }
  const dependencies = {}
  const result = await esbuild({
    bundle: true,
    minify: !!production,
    outdir: 'out',
    incremental: watch,
    metafile: watch ? 'meta.json' : undefined,
    ...opts,
    define: {
      global: 'window',
      'process.env.NODE_ENV': production ? '"production"' : '"dev"',
      ...opts.define
    },
    plugins: [plugins(opts, styles, dependencies)],
    write: false
  })

  return { result, styles, dependencies }
}

export default createBuild
