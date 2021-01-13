import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'

type Opts = {
  port: number
  file: string
}

// shared types
export default async ({ port = 3001 }: Opts) => {
  console.log('yesh for you')

  const ip = await v4()

  console.info(
    chalk.blue('Aristotle development server'),
    'http://' + ip + ':' + port
  )

  const server = http.createServer((req, res) => {
    res.end('flurpdrol')
  })

  server.listen(port)

  return server
}
