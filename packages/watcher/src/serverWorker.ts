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
      console.log('yesh from worker', msg)
    })
    worker.on('error', err => {
      console.log('yeshcrash in worker', err)
    })
    worker.on('exit', code => {
      console.log('worker exit times', code)
    })

    worker.postMessage('flapperpants')
  }

  public worker: Worker

  public checksum: string

  public render(
    req: http.IncomingMessage,
    res: http.OutgoingMessage
  ): Promise<RenderResult> {
    return new Promise((resolve, reject) => {
      resolve(undefined)
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
