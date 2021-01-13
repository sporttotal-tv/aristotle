import { parentPort, workerData } from 'worker_threads'
import evalServer from 'eval'

try {
  const server = evalServer(workerData)
  let serverFunction: (a: any, b: any, c: any) => any
  if (server.default) {
    serverFunction = server.default
  } else if (typeof server === 'function') {
    serverFunction = server
  } else {
    console.error('WRONG SERVER FILE PUT NICE')
  }

  if (serverFunction) {
    console.log('got nice server in worker!')
  }
} catch (err) {
  console.error(err)
}

// need to completely polyfill req and res

/*
    have all files available (LAME)
    maybe exclude files for dev... :(
*/

/*
        GET NEW REQ

        // ten add a getter for text (buffers are fastest)


*/

parentPort.on('message', message => {
  parentPort.postMessage('yesh from boy ' + message)
})
