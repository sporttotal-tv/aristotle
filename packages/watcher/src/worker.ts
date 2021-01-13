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

/*
    have all files available (LAME)
    maybe exclude files for dev... :(
*/

parentPort.on('message', message => {
  parentPort.postMessage('yesh from boy ' + message)
})
