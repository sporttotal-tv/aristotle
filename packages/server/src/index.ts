import { BuildResult } from '@saulx/aristotle-build'
import {
  RenderFunction,
  CacheFunction,
  defaultRenderer,
  defaultCache
} from '@saulx/aristotle-server-utils'
import getSsl from '@saulx/ops-get-ssl'
import https from 'https'
import http from 'http'
import createBuildResult from './createBuildResult'

console.log('this is a server!')

type ServerOpts = {
  port: number
  renderer?: RenderFunction
  cacheFunction?: CacheFunction
  buildJson?: string
  buildResult?: BuildResult
}

// then we make it into a render Opts

const createServer = async ({
  port,
  buildResult,
  buildJson,
  renderer,
  cacheFunction
}: ServerOpts) => {
  // @ts-ignore pretty strange it does have types...
  const ssl = getSsl()

  if (!buildResult && buildJson) {
    buildResult = await createBuildResult(buildJson)
  }

  if (!renderer) {
    renderer = defaultRenderer
  }

  if (!cacheFunction) {
    cacheFunction = defaultCache
  }

  const handler = (req: http.IncomingMessage, res: http.OutgoingMessage) => {}

  const server = ssl ? https.createServer(handler) : http.createServer(handler)

  server.listen(port)
}

export default createServer
