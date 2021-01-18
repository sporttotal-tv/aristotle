import { RenderResult, ServeResult } from './types'
import { hash } from '@saulx/utils'
import { File } from '@saulx/aristotle-build'
import util from 'util'
import zlib from 'zlib'

const gzip = util.promisify(zlib.gzip)

const minify = (str: string): string => {
  if (typeof str === 'string' && str.indexOf('<html') !== -1) {
    str = str.replace(/\n/g, '')
    str = str.replace(/[\t ]+</g, '<')
    str = str.replace(/>[\t ]+</g, '><')
    str = str.replace(/>[\t ]+$/g, '>')
    str = str.replace(/\s{1, 30}+/g, ' ')
    str = str.replace(/\t{1, 30}+/g, ' ')
  }
  return str
}

export const genServeFromRender = async (
  renderResult: string | RenderResult,
  compress: boolean = false
): Promise<ServeResult> => {
  let contents: Buffer

  if (typeof renderResult === 'string') {
    if (compress) {
      contents = Buffer.from(minify(renderResult))
    } else {
      contents = Buffer.from(renderResult)
    }
  } else if (renderResult === undefined) {
    contents = Buffer.from('')
  } else if (typeof renderResult.contents === 'string') {
    contents = Buffer.from(
      compress && (!renderResult.mime || renderResult.mime === 'text/html')
        ? minify(renderResult.contents)
        : renderResult.contents
    )
  } else {
    contents = renderResult.contents
  }

  if (typeof renderResult === 'object') {
    const isGzip = renderResult.gzip
    let realContents: Buffer
    if (compress && !isGzip) {
      realContents = await gzip(contents)
    } else {
      realContents = contents
    }

    const serveResult: ServeResult = {
      cache: 300,
      memCache: renderResult.memCache || 60,
      checksum: renderResult.checksum || hash(contents).toString(16),
      contents: realContents,
      contentLength: realContents.byteLength,
      gzip: renderResult.gzip || compress,
      mime: renderResult.mime || 'text/html',
      statusCode: renderResult.statusCode || 200
    }
    return serveResult
  } else {
    const checksum = hash(contents).toString(16)
    if (compress) {
      contents = await gzip(contents)
    }
    const serveResult: ServeResult = {
      cache: 300,
      memCache: 60,
      checksum,
      contents,
      contentLength: contents.byteLength,
      gzip: compress,
      mime: 'text/html',
      statusCode: 200
    }
    return serveResult
  }
}

export const genServeFromFile = (file: File): ServeResult => {
  const serveResult: ServeResult = {
    cache: 'immutable',
    memCache: 0, // does not need it
    checksum: file.checksum,
    contents: file.contents,
    contentLength: file.contents.byteLength,
    gzip: !!file.gzip,
    mime: file.mime,
    statusCode: 200
  }
  return serveResult
}
