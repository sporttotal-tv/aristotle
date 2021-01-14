import build from './build'
import watch from './watch'

export class File {
  constructor(obj) {
    for (let key in obj) {
      this[key] = obj[key]
    }
  }
  public contents: Buffer
  public gzip: boolean
  public url: string
  public checksum: string
  public mime: string
  public path: string
  public get text(): string {
    return this.contents.toString()
  }
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
  splitting?: boolean
  format?: string
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
