import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'
import getPort from 'get-port'
import startLiveReload from './livereload'
import genRenderOpts from './genRenderOpts'

type Opts = {
  port: number
  file: string
  reloadPort?: number
}

// shared types
export default async ({ port = 3001, file, reloadPort }: Opts) => {
  const ip = await v4()

  if (!reloadPort) {
    reloadPort = await getPort()
  }

  // want browser as a file prob
  const { update, browser } = startLiveReload(reloadPort)

  console.info(
    chalk.blue('Aristotle development server'),
    'http://' + ip + ':' + port
  )
  console.info(chalk.grey(file))

  const server = http.createServer((req, res) => {
    // do everything here
    res.end('flurpdrol')
  })

  server.listen(port)

  return server
}
