import { Worker, workerData } from 'worker_threads'
import { File, BuildResult } from '@saulx/aristotle-build'
import { join } from 'path'
import http from 'http'
import { RenderResult } from './types'

export class RenderWorker {
  constructor(server: File) {
    const worker = new Worker(join(__dirname, './worker.js'), {
      workerData: server.text
    })

    worker.on('message', msg => {
      const { type, reqId, payload } = msg
      if (type === 'ready') {
        console.log('its ready!', type, reqId, payload)

        if (this.requests[reqId]) {
          this.requests[reqId].ready(payload)
        }
      } else if (type === 'method') {
        // has to attach to req and res
      }
    })

    worker.on('error', err => {
      console.log('yeshcrash in worker', err)
    })

    worker.on('exit', code => {
      console.log('worker exit times', code)
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

  public render(
    req: http.IncomingMessage,
    res: http.OutgoingMessage
  ): Promise<RenderResult> {
    return new Promise((resolve, reject) => {
      const reqId = Math.round(Math.random() * 99999999)

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
      resolve(undefined)
    })
  }

  public stop() {}
}

export const genWorker = (server: File): RenderWorker => {
  return new RenderWorker(server)
}
