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
import { genWorker, RenderWorker } from './serverWorker'
import parseReq from './parseReq'

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

  let buildresult: BuildResult
  let ssr: RenderWorker
  let ssrInProgress: string

  build(buildOpts, async result => {
    // compare all checksums and lengths
    buildresult = result
    buildresult.files[browser.url] = browser
    buildresult.js.push(browser)
    if (ssr) {
      await ssr.updateBuildResult(buildresult)
    }
    update()
  })

  if (serverTarget) {
    console.info('  server ', chalk.grey(serverTarget))
    const buildOptsServer: BuildOpts = {
      entryPoints: [serverTarget],
      platform: 'node'
    }
    if (serverTarget) {
      build(buildOptsServer, async result => {
        const checksum = result.js[0].checksum
        if (ssrInProgress === checksum) {
          // console.log('change with no update - ignore', checksum)
        } else {
          ssrInProgress = checksum
          if (!ssr || checksum !== ssr.checksum) {
            if (ssr) {
              // can actualy not make new one all the time - just use one until it crashes
              ssr.stop()
            }
            ssr = await genWorker(result.js[0])
            ssr.updateBuildResult(buildresult)
            console.info(chalk.grey('Server initialized'))
            ssrInProgress = undefined
            update()
          }
        }
      })
    }
  }

  console.info('')

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
      if (ssr) {
        serve(res, genServeFromRender(await ssr.render(parseReq(req, false))))
      } else {
        const renderRes = genRenderOpts(parseReq(req, false), buildresult)
        const r = await defaultRender(renderRes)
        serve(res, genServeFromRender(r))
      }
    }
  })

  server.listen(port)

  return server
}
