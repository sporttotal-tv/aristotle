import { parentPort, workerData } from 'worker_threads'
import evalServer from 'eval'

try {
  const server = evalServer(workerData)
  let serverFunction: (...args: any[]) => any
  if (server.default) {
    serverFunction = server.default
  } else if (typeof server === 'function') {
    serverFunction = server
  } else {
    console.error('WRONG SERVER FILE PUT NICE')
  }

  if (serverFunction) {
    console.log('got nice server in worker!')
    parentPort.on('message', async message => {
      const { type, reqId } = message

      if (type === 'render') {
        console.log('go render time!', message)

        const result = await serverFunction({
          head: '',
          body: ''
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
