import { build as esbuild } from 'esbuild'
import stylePlugin from './stylePlugin'

const createBuild = async ({ watch, ...opts }) => {
  const styles = { css: {}, fileCache: {} }
  const result = await esbuild({
    bundle: true,
    minify: true,
    outdir: 'out',
    incremental: watch,
    metafile: watch && 'meta.json',
    ...opts,
    define: {
      global: 'window',
      'process.env.NODE_ENV': opts.minify ? '"production"' : '"dev"',
      ...opts.define
    },
    plugins: [stylePlugin(styles)],
    write: false
  })

  return { result, styles }
}

export default createBuild
