import http from 'http'
import { ServeResult } from './types'

export default (res: http.OutgoingMessage, serveResult: ServeResult): void => {
  res.setHeader('access-control-allow-origin', '*')

  res.setHeader('content-length', serveResult.contentLength)
  res.setHeader('content-type', serveResult.mime)

  // @ts-ignore
  res.statusCode = serveResult.statusCode
  res.setHeader('cache-control', serveResult.cache)
  res.setHeader('ETag', serveResult.checksum)

  if (serveResult.gzip) {
    res.setHeader('content-encoding', 'gzip')
  }

  res.end(serveResult.contents)
}
