import { File } from '@saulx/aristotle-build'

export type Ua = {
  version: number
  prefix: string
  platform: string
  device: string
}

export type ParsedReq = {
  es5browser: boolean // better name
  headers: {
    [key: string]: string | string[]
  }
  url: {
    href: string
    origin: string
    protocol: string
    username: string
    password: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    searchParams: { [key: string]: string }
    hash: string
  }
  ip: string
  method: string
  language: string
  ua: Ua
}

// also send req ofc
export type RenderOpts = ParsedReq & {
  body: string
  head: string
  env: string[]
  envFile: string
  js: File[]
  css: File[]
  files: {
    [filename: string]: File
  }
}

// allow undefined to break connection

export type RenderResult =
  | null
  | string
  | {
      memCache: number
      cache: number
      checksum: string
      contents: Buffer | string
      contentLength?: number
      gzip?: boolean
      mime?: string
      statusCode?: number
    }

export type ServeResult = {
  cache: number | string
  memCache: number
  checksum: string
  contents: Buffer
  contentLength: number
  mime: string
  gzip: boolean
  statusCode: number
}

export type RenderFunction = (renderOpts: RenderOpts) => Promise<RenderResult>

export type CacheFunction = (renderOpts: RenderOpts) => string
