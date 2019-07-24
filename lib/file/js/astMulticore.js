const cp = require('child_process')
const os = require('os')
const cpuCount = os.cpus().length
const workers = []
const { join } = require('path')

console.log(cpuCount)

for (let i = 0; i < cpuCount; i++) {
  const child = cp.fork(join(__dirname, './ast'))
  const worker = {
    child,
    draining: false,
    q: [],
    drain: () => {
      if (!worker.draining) {
        if (worker.q.length) {
          worker.draining = true
          child.send(worker.q[0][0])
        }
      }
    }
  }
  child.on('message', msg => {
    worker.q[0][1](msg)
    worker.q.shift()
    if (worker.q.length === 0) {
      worker.draining = false
    }
    worker.drain()
  })
  workers.push(worker)
}

const sendToWorker = (payload, cb) => {
  let smallest
  workers.forEach(w => {
    if (smallest === void 0 || w.q.length < smallest.q.length) {
      smallest = w
    }
  })
  smallest.q.push([payload, cb])
  smallest.drain()
}

console.log('ast parsing on ', cpuCount, 'cores')

exports.es2015 = code =>
  new Promise(resolve => {
    const args = [code]
    sendToWorker({ es2015: args }, msg => {
      resolve(msg.es2015)
    })
  })

exports.parseCode = (file, raw, dontParseRequires, type) =>
  new Promise(resolve => {
    const args = [file, raw, dontParseRequires, type]
    sendToWorker({ parseCode: args }, msg => {
      resolve(msg.parseCode)
    })
  })
