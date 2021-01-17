import parseReq from './parseReq'
import defaultRenderer, { cache as defaultCache } from './defaultRenderer'
import genEnvfile from './genEnvfile'
import genRenderOpts from './genRenderOpts'
import { genServeFromFile, genServeFromRender } from './genServeResult'
import hasServer from './hasServer'
import serve from './serve'
import isPublicFile from './isPublicFile'

export type BuildJson = {
  js: string[]
  css: string[]
  files: string[]
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
