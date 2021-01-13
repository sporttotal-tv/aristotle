import { parentPort, workerData } from 'worker_threads'
import evalServer from 'eval'
import { BuildResult } from '@saulx/aristotle-build'

try {
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
      const { type, reqId } = message

      if (type === 'buildresult') {
        const { operation, data, file, key } = message
        if (operation === 'new') {
          buildresult.files[key] = {
            ...file,
            contents: Buffer.from(data)
          }
        } else if (operation === 'delete') {
          delete buildresult.files[key]
        }
        // parentPort.postMessage({
        //     type: 'buildresult-added',
        //     reqId,
        //     payload: result
        //   })
      } else if (type === 'render') {
        // console.log('go render time!', message)

        const result = await serverFunction({
          head: '',
          body: '',
          ...buildresult
        })

        parentPort.postMessage({
          type: 'ready',
          reqId,
          payload: result
        })
      }
    })
  } else {
    throw new Error('No server function defined, export function from file!')
  }
  //   parentPort.postMessage('yesh from boy ' + message)
} catch (err) {
  console.error('CANNOT INITIALIZE DISCARD', err)
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
