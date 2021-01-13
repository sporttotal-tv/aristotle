import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'
import getPort from 'get-port'
import startLiveReload from './livereload'
import genRenderOpts from './genRenderOpts'
import build, { BuildOpts, BuildResult } from '@saulx/aristotle-build'
import defaultRender from './defaultRender'
import { genServeFromFile, genServeFromRender } from './genServeResult'
import serve from './serve'
import hasServer from './hasServer'

type Opts = {
  port: number
  target: string
  reloadPort?: number
}

// shared types
export default async ({ target, port = 3001, reloadPort = 6634 }: Opts) => {
  const ip = await v4()

  reloadPort = await getPort({ port: reloadPort })

  // check if server
  const buildOpts: BuildOpts = {
    entryPoints: [target],
    platform: 'browser'
  }

  // want browser as a file prob
  const { update, browser } = startLiveReload(reloadPort)

  await console.info(
    chalk.blue('Aristotle development server'),
    'http://' + ip + ':' + port
  )

  const serverTarget = await hasServer(target)

  console.info('  browser', chalk.grey(target))

  if (serverTarget) {
    console.info('  server ', chalk.grey(serverTarget))
  }

  let buildresult: BuildResult

  build(buildOpts, result => {
    console.log('HELLO UPDATE')
    buildresult = result
    buildresult.files[browser.url] = browser
    buildresult.js.push(browser)
    update()
  })

  const server = http.createServer(async (req, res) => {
    if (!buildresult) {
      res.end('WAIT FOR RESULT!')
      return
    }

    const url = req.url
    const file = buildresult.files[url]
    if (file) {
      serve(res, genServeFromFile(file))
    } else {
      const renderRes = genRenderOpts(req, buildresult)
      const r = await defaultRender(renderRes, req, res)
      if (r !== undefined) {
        serve(res, genServeFromRender(r))
      }
    }
  })

  server.listen(port)

  return server
}
