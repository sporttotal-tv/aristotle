import { Worker } from 'worker_threads'
import { BuildResult } from '@saulx/aristotle-build'
import { join } from 'path'
import { ParsedReq, RenderResult } from '@saulx/aristotle-server-utils'
import { EventEmitter } from 'events'

export class RenderWorker extends EventEmitter {
  constructor(build: BuildResult) {
    super()
    this.build = build
    const file = build.js[0]
    const worker = new Worker(join(__dirname, './worker.js'), {
      workerData: file.text
    })
    worker.on('message', msg => {
      const { type, reqId } = msg
      if (type === 'initialized') {
        this.initialized = true
        this.initializedListeners.forEach(fn => {
          fn()
          this.initializedListeners.delete(fn)
        })
      } else if (this.requests[reqId]) {
        this.requests[reqId](msg)
      }
    })
    worker.on('error', err => {
      this.emit('error', err)
    })
    worker.on('exit', code => {
      this.emit('exit', code)
    })
    this.worker = worker
    this.checksum = file.checksum
  }

  public initialized: boolean = false

  public genReqId(): number {
    return Math.round(Math.random() * 99999999)
  }

  public requests: {
    [reqId: string]: (x: any) => void
  } = {}

  public worker: Worker

  public checksum: string

  public sharedBuilds: { [key: string]: Uint8Array } = {}

  public initializedListeners: Set<() => void> = new Set()

  public build: BuildResult

  public render(req: ParsedReq): Promise<RenderResult> {
    return new Promise((resolve, reject) => {
      const reqId = this.genReqId()
      this.requests[reqId] = x => {
        delete this.requests[reqId]
        if (x.error) {
          reject(x.error)
        } else {
          resolve(x.payload)
        }
      }
      this.worker.postMessage({
        type: 'render',
        reqId,
        req
      })
    })
  }

  public checkCache(req: ParsedReq): Promise<string> {
    return new Promise((resolve, reject) => {
      const reqId = this.genReqId()
      this.requests[reqId] = x => {
        delete this.requests[reqId]
        if (x.error) {
          reject(x.error)
        } else {
          resolve(x.payload)
        }
      }
      this.worker.postMessage({
        type: 'cache',
        reqId,
        req
      })
    })
  }

  public updatecode(build: BuildResult): Promise<void> {
    this.build = build
    const file = build.js[0]
    return new Promise((resolve, reject) => {
      const reqId = this.genReqId()
      this.requests[reqId] = x => {
        this.checksum = file.checksum
        delete this.requests[reqId]
        if (x.error) {
          reject()
        } else {
          resolve()
        }
      }
      this.worker.postMessage({
        type: 'updateCode',
        reqId,
        code: file.text
      })
    })
  }

  public updateBuildResult(buildresult: BuildResult): Promise<void> {
    return new Promise(resolve => {
      const sharedBuilds = this.sharedBuilds
      const reqId = this.genReqId()
      let cnt = 0

      for (const key in sharedBuilds) {
        if (!buildresult.files[key]) {
          cnt++
          this.worker.postMessage({
            type: 'buildresult',
            operation: 'delete',
            key,
            reqId
          })
          delete sharedBuilds[key]
        }
      }

      for (const key in buildresult.files) {
        if (!sharedBuilds[key]) {
          const file = buildresult.files[key]
          const fileContents = file.contents
          const buf: SharedArrayBuffer = new SharedArrayBuffer(
            fileContents.byteLength
          )
          var uint8 = new Uint8Array(buf)
          for (let i = 0; i < fileContents.byteLength; ++i) {
            uint8[i] = fileContents[i]
          }
          sharedBuilds[key] = uint8
          cnt++
          this.worker.postMessage({
            type: 'buildresult',
            operation: 'new',
            key,
            reqId,
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
      }

      if (cnt) {
        this.requests[reqId] = x => {
          cnt--
          if (cnt === 0) {
            delete this.requests[reqId]
            const newReq = this.genReqId()
            this.requests[newReq] = x => {
              resolve()
              delete this.requests[newReq]
            }
            this.worker.postMessage({
              type: 'buildresult',
              operation: 'meta',
              reqId: newReq,
              key: 'build',
              meta: {
                js: buildresult.js.map(v => v.url),
                css: buildresult.css.map(v => v.url),
                dependencies: buildresult.dependencies,
                env: buildresult.env,
                entryPoints: buildresult.entryPoints
              }
            })
          }
        }
      } else {
        resolve()
      }
    })
  }

  public isInitialized(): Promise<void> {
    return new Promise(resolve => {
      if (this.initialized) {
        resolve()
      } else {
        this.initializedListeners.add(resolve)
      }
    })
  }

  public stop() {
    this.worker.terminate()
    delete this.sharedBuilds
  }
}

export const genWorker = async (build: BuildResult): Promise<RenderWorker> => {
  const worker = new RenderWorker(build)
  await worker.isInitialized()
  return worker
}
