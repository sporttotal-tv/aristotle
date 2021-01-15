import { RenderResult, ServeResult } from './types'
import { hash } from '@saulx/utils'
import { File } from '@saulx/aristotle-build'

export const genServeFromRender = (
  renderResult: string | RenderResult
): ServeResult => {
  let contents: Buffer

  if (typeof renderResult === 'string') {
    contents = Buffer.from(renderResult)
  } else if (renderResult === undefined) {
    contents = Buffer.from('')
  } else if (typeof renderResult.contents === 'string') {
    contents = Buffer.from(renderResult.contents)
  } else {
    contents = renderResult.contents
  }

  if (typeof renderResult === 'object') {
    const serveResult: ServeResult = {
      cache: 300,
      memCache: renderResult.memCache || 60,
      checksum: renderResult.checksum || hash(contents).toString(16),
      contents,
      contentLength:
        renderResult.contentLength === undefined
          ? contents.byteLength
          : renderResult.contentLength,
      gzip: renderResult.gzip || false,
      mime: renderResult.mime || 'text/html',
      statusCode: renderResult.statusCode || 200
    }
    return serveResult
  } else {
    const checksum = hash(contents).toString(16)
    const serveResult: ServeResult = {
      cache: 300,
      memCache: 60,
      checksum,
      contents,
      contentLength: contents.byteLength,
      gzip: false,
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
