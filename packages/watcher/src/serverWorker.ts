import { Worker, workerData } from 'worker_threads'
import { File } from '@saulx/aristotle-build'
import { join } from 'path'
import http from 'http'
import { RenderResult } from './types'

export type RenderWorker = {
  worker: Worker
  checksum: string
  render: (
    req: http.IncomingMessage,
    res: http.OutgoingMessage
  ) => Promise<RenderResult>
}

export const genWorker = (server: File): RenderWorker => {
  // add all in here...
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

  const render = (
    req: http.IncomingMessage,
    res: http.OutgoingMessage
  ): Promise<RenderResult> =>
    new Promise((resolve, reject) => {
      console.log('go time')
    })

  return {
    worker,
    checksum: server.checksum,
    render
  }
}
