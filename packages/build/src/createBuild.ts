import { build as esbuild } from 'esbuild'
import plugins from './plugins'

const createBuild = async (opts, watch) => {
  const styles = { css: {}, fileCache: {} }
  const dependencies = {}
  const result = await esbuild({
    bundle: true,
    minify: true,
    outdir: 'out',
    incremental: watch,
    metafile: watch ? 'meta.json' : undefined,
    ...opts,
    define: {
      global: 'window',
      // 'process.env.NODE_ENV': opts.minify ? '"production"' : '"dev"',
      ...opts.define
    },
    plugins: [plugins(opts, styles, dependencies)],
    write: false
  })

  return { result, styles, dependencies }
}

export default createBuild
