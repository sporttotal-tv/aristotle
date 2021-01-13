import { Worker, workerData } from 'worker_threads'
import { File, BuildResult } from '@saulx/aristotle-build'
import { join } from 'path'
import http from 'http'
import { RenderResult } from './types'
import chalk, { bgBlue } from 'chalk'

export class RenderWorker {
  constructor(server: File) {
    const worker = new Worker(join(__dirname, './worker.js'), {
      workerData: server.text
    })

    worker.on('message', msg => {
      const { type, reqId, payload } = msg
      if (type === 'ready') {
        // console.log('its ready!', type, reqId)

        if (this.requests[reqId]) {
          this.requests[reqId].ready(payload)
        }
      } else if (type === 'method') {
        // has to attach to req and res
      } else if (type === 'initialized') {
        this.initializedListeners.forEach(v => {
          this.initializedListeners.delete(v)
          v()
        })
      }
    })

    worker.on('error', err => {
      console.log('yeshcrash in worker', err)
    })

    worker.on('exit', code => {
      //   console.log('worker exit times', code)
    })

    this.worker = worker
    // worker.postMessage('flapperpants')
  }

  public requests: {
    [reqId: string]: {
      req: http.IncomingMessage
      res: http.OutgoingMessage
      ready: (x: any) => void
    }
  } = {}

  public worker: Worker

  public checksum: string

  public initializedListeners: Set<() => void> = new Set()

  public render(
    req: http.IncomingMessage,
    res: http.OutgoingMessage
  ): Promise<RenderResult> {
    return new Promise((resolve, reject) => {
      const reqId = Math.round(Math.random() * 99999999)

      // server side errors?

      // default time out?
      this.requests[reqId] = {
        ready: x => {
          delete this.requests[reqId]
          resolve(x)
        },
        res,
        req
      }

      this.worker.postMessage({
        type: 'render',
        reqId
      })
    })
  }

  public updateBuildResult(buildresult: BuildResult): Promise<void> {
    return new Promise((resolve, reject) => {
      // updated shared mem
      //   console.log('update build', buildresult)

      const sharedBuilds = {}

      for (const key in buildresult.files) {
        const file = buildresult.files[key]
        const fileContents = file.contents

        const buf: SharedArrayBuffer = new SharedArrayBuffer(
          fileContents.byteLength
        )

        var uint8 = new Uint8Array(buf)

        for (let i = 0; i < fileContents.byteLength; ++i) {
          uint8[i] = fileContents[i]
        }

        // clear mem if they do not exist anymore!

        this.worker.postMessage({
          type: 'buildresult',
          operation: 'new',
          key,
          file: {
            url: key,
            path: file.path,
            checksum: file.checksum,
            gzip: file.gzip,
            mime: file.mime
          },
          data: uint8
        })
      }

      resolve(undefined)
    })
  }

  public isInitialized(): Promise<void> {
    return new Promise(resolve => {
      this.initializedListeners.add(resolve)
    })
  }

  public stop() {
    // or try to reuse :/
    // delete this.requests
    this.worker.terminate()
  }
}

export const genWorker = async (server: File): Promise<RenderWorker> => {
  const worker = new RenderWorker(server)
  await worker.isInitialized()
  return worker
}
