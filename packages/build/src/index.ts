import build from './build'
import watch from './watch'

export type File = {
  checksum: string
  path: string
  contents: Buffer
  compressed: boolean
  gzip: boolean
  text: string
  mime: string
  url: string
}

export type BuildResult = {
  env: string[]
  js: File[]
  css: File[]
  files: {
    [filename: string]: File
  }
  errors: string[]
  dependencies: {
    [pkg: string]: string
  }
}

export type BuildOpts = {
  entryPoints: string[]
  external?: string[]
  minify?: boolean
  production?: boolean
  platform?: 'node' | 'browser'
  sourcemap?: boolean
  cssReset?: boolean
  gzip?: boolean
}

export type WatchCb = (result: BuildResult) => void

export default (opts: BuildOpts, watchCb?: WatchCb) => {
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
