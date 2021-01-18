import parseReq from './parseReq'
import defaultRenderer, { cache as defaultCache } from './defaultRenderer'
import genEnvfile from './genEnvfile'
import genRenderOpts from './genRenderOpts'
import { genServeFromFile, genServeFromRender } from './genServeResult'
import hasServer from './hasServer'
import serve from './serve'
import isPublicFile from './isPublicFile'

export type BuildJsonFile = {
  contents: string
  gzip: boolean
  url: string
  checksum: string
  mime: string
  path: string
}

export type BuildJson = {
  js: string[]
  css: string[]
  files: { [key: string]: BuildJsonFile }
  env: string[]
  entryPoints: string[]
}

export {
  parseReq,
  defaultRenderer,
  defaultCache,
  genEnvfile,
  genRenderOpts,
  genServeFromFile,
  genServeFromRender,
  hasServer,
  isPublicFile,
  serve
}

export * from './types'
