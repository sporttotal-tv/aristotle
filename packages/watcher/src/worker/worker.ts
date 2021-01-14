import { parentPort, workerData } from 'worker_threads'
import evalServer from 'eval'
import { BuildResult, File } from '@saulx/aristotle-build'
import genRenderOpts from '../genRenderOpts'

try {
  // make this into a function in postmessage...
  const server = evalServer(workerData, 'app-server', {}, true)
  let serverFunction: (...args: any[]) => any
  if (server.default) {
    serverFunction = server.default
  } else if (typeof server === 'function') {
    serverFunction = server
  } else {
    console.error('WRONG SERVER FILE PUT NICE')
  }

  if (serverFunction) {
    const buildresult: BuildResult = {
      js: [],
      css: [],
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

      if (type === 'buildresult') {
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
        try {
          const result = await serverFunction(genRenderOpts(req, buildresult))
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
    })
  } else {
    throw new Error('No server function defined, export function from file!')
  }
} catch (err) {
  console.error('CANNOT INITIALIZE DISCARD WORKER', err)
  /*    
    1: cannot init
  */
  parentPort.postMessage({
    type: 'error',
    code: 1,
    message: err.message
  })
}

// need to completely polyfill req and res
/*
    have all files available (LAME)
    maybe exclude files for dev... :(
*/
