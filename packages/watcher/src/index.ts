import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'

type Opts = {
  port: number
  file: string
}

type File = {
  checksum: string
  path: string
  contents: Buffer
  compressed: boolean
  gzip: boolean
  text: string
  mime: string
  url: string
}

//   server: string

// also send req ofc
type RenderOpts = {
  body: string
  head: string
  env: string[]
  envFile: string
  scripts: File[]
  styles: File[]
  files: {
    [filename: string]: File
  }
  url: string
  queryString: string
  language: string
  userAgent: {
    device: string
    browser: string
    version: number
  }
}

type RenderResult =
  | string
  | undefined
  | {
      cache: number
      checksum: string
      contents: Buffer | string
      contentLength?: number
      gzip?: boolean
      mime?: string
      statusCode?: number
    }

type RenderFunction = (
  RenderOpts: RenderOpts,
  req: http.IncomingMessage,
  res: http.OutgoingMessage
) => Promise<RenderResult>

// shared types
export default async ({ port = 3001, file }: Opts) => {
  const ip = await v4()

  console.info(
    chalk.blue('Aristotle development server'),
    'http://' + ip + ':' + port
  )
  console.info(chalk.grey(file))

  const server = http.createServer((req, res) => {
    res.end('flurpdrol')
  })

  server.listen(port)

  return server
}
