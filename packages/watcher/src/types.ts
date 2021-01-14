import { File } from '@saulx/aristotle-build'

// also send req ofc
export type RenderOpts = {
  body: string
  head: string
  env: string[]
  envFile: string
  js: File[]
  css: File[]
  files: {
    [filename: string]: File
  }
  es5browser: boolean // better name
  headers: {
    [key: string]: string
  }
  url: string
  queryString: string
  ip: string
  domain?: string
  language: string
  userAgent: {
    device: string
    browser: string
    version: number
  }
}

export type RenderResult =
  | undefined
  | string
  | {
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
  checksum: string
  contents: Buffer
  contentLength: number
  mime: string
  gzip: boolean
  statusCode: number
}

export type RenderFunction = (renderOpts: RenderOpts) => Promise<RenderResult>

export type CacheFunction = (renderOpts: RenderOpts) => string
