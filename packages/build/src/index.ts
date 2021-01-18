import build from './build'
import watch from './watch'
import { BuildResult } from '@saulx/aristotle-types'

export type BuildOpts = {
  entryPoints: string[]
  minify?: boolean
  production?: boolean
  platform?: 'node' | 'browser'
  sourcemap?: boolean
  cssReset?: boolean
  gzip?: boolean
  splitting?: boolean
  format?: string
  target?: string
  external?: string[]
  loader?: {
    [ext: string]: string
  }
  define?: {
    [variable: string]: string
  }
}

export type WatchCb = (result: BuildResult) => void

export default (opts: BuildOpts, watchCb?: WatchCb): Promise<BuildResult> => {
  if (opts.production) {
    if (!('minify' in opts)) {
      opts.minify = true
    }
    if (!('gzip' in opts)) {
      opts.gzip = true
    }
  }

  return watchCb ? watch(opts, watchCb) : build(opts)
}
