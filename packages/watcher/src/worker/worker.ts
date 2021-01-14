import { parentPort, workerData } from 'worker_threads'
import evalCode from 'eval'
import { BuildResult, File } from '@saulx/aristotle-build'
import genRenderOpts from '../genRenderOpts'

type ServerFunction = (...args: any[]) => any

const evalServer = (
  code: string
): { serverFunction?: ServerFunction; error?: Error } => {
  try {
    const server = evalCode(code, 'app-server', {}, true)
    let serverFunction: ServerFunction

    if (server.default) {
      serverFunction = server.default
    } else if (typeof server === 'function') {
      serverFunction = server
    } else {
      return { error: new Error('No server function defined') }
    }
    if (serverFunction) {
      return { serverFunction: serverFunction }
    } else {
      return { error: new Error('No server function defined') }
    }
  } catch (error) {
    return { error }
  }
}

let server: ServerFunction
const { serverFunction, error } = evalServer(workerData)
let buildError = error

server = serverFunction

const buildresult: BuildResult = {
  js: [],
  css: [],
  entryPoints: [],
  env: [],
  errors: [],
  files: {},
  dependencies: {}
}

parentPort.postMessage({
  type: 'initialized'
})

parentPort.on('message', async message => {
  const { type, reqId, req } = message
  if (type === 'updateCode') {
    const { code } = message
    const { serverFunction, error } = evalServer(code)
    if (serverFunction) {
      // make nicer!
      server = serverFunction
      parentPort.postMessage({
        type: 'updateCode',
        reqId
      })
    } else {
      server = undefined
      buildError = error
      parentPort.postMessage({
        type: 'updateCode',
        error,
        reqId
      })
    }
  } else if (type === 'buildresult') {
    const { operation, data, file, key, meta } = message
    if (operation === 'new') {
      buildresult.files[key] = new File({
        ...file,
        gzip: file.gzip || false,
        contents: Buffer.from(data)
      })
    } else if (operation === 'delete') {
      delete buildresult.files[key]
    } else if (operation === 'meta') {
      buildresult.entryPoints = meta.entryPoints
      buildresult.js = meta.js.map(v => buildresult.files[v])
      buildresult.css = meta.css.map(v => buildresult.files[v])
      buildresult.env = meta.env
      buildresult.dependencies = meta.dependencies
      buildresult.errors = []
    }
    parentPort.postMessage({
      type: 'buildresult',
      reqId,
      operation,
      key
    })
  } else if (type === 'render') {
    if (!server) {
      parentPort.postMessage({
        type: 'ready',
        reqId,
        error: buildError
      })
    } else {
      try {
        const result = await server(genRenderOpts(req, buildresult))
        parentPort.postMessage({
          type: 'ready',
          reqId,
          payload: result
        })
      } catch (err) {
        parentPort.postMessage({
          type: 'ready',
          reqId,
          error: err
        })
      }
    }
  }
})
