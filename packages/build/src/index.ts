import build from './build'
import watch from './watch'
import zlib from 'zlib'

export class File {
  constructor(obj: { [key: string]: any }) {
    for (let key in obj) {
      if (key !== 'text') {
        this[key] = obj[key]
      }
    }
  }
  public contents: Buffer
  public gzip: boolean
  public url: string
  public checksum: string
  public mime: string
  public path: string
  private _uncompressed: string
  public get text(): string {
    if (this.gzip) {
      if (!this._uncompressed) {
        const raw = zlib.gunzipSync(this.contents)
        this._uncompressed = raw.toString('utf8')
      }
      return this._uncompressed
    }

    return this.contents.toString()
  }
}

export type BuildError = {
  detail?: string
  location: {
    column: number
    file: string
    length: number
    line: number
    lineText: string
  }
  text: string
}

export type BuildResult = {
  entryPoints: string[]
  env: string[]
  js: File[]
  css: File[]
  files: {
    [filename: string]: File
  }
  errors: BuildError[]
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
