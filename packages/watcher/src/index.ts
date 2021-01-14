import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'
import getPort from 'get-port'
import startLiveReload from './livereload'
import genRenderOpts from './genRenderOpts'
import build, { BuildOpts, BuildResult, File } from '@saulx/aristotle-build'
import defaultRender from './defaultRender'
import { genServeFromFile, genServeFromRender } from './genServeResult'
import serve from './serve'
import hasServer from './hasServer'
import { genWorker, RenderWorker } from './worker/serverWorker'
import parseReq from './parseReq'
import { ServeResult } from './types'

// also extra build options!
// e.g exclude etc
type Opts = {
  port: number
  target: string
  reloadPort?: number
}

export default async ({ target, port = 3001, reloadPort = 6634 }: Opts) => {
  const ip = await v4()

  reloadPort = await getPort({ port: reloadPort })

  // check if server
  const buildOpts: BuildOpts = {
    entryPoints: [target],
    platform: 'browser'
  }

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
  let ssrFiles: { [key: string]: File } = {}

  build(buildOpts, async result => {
    // compare all checksums and lengths
    buildresult = result
    if (ssr) {
      for (let key in ssrFiles) {
        if (!result.files[key]) {
          result.files[key] = ssrFiles[key]
        }
      }
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
        ssrFiles = {}
        for (let key in result.files) {
          const file = result.files[key]
          if (
            file.mime.split('/')[0] !== 'application' &&
            file.mime !== 'text/css'
          ) {
            ssrFiles[key] = file
            if (buildresult) {
              buildresult.files[key] = file
            }
          }
        }

        const checksum = result.js[0].checksum
        if (ssrInProgress === checksum) {
          // console.log('change with no update - ignore', checksum)
        } else {
          ssrInProgress = checksum
          if (!ssr || checksum !== ssr.checksum) {
            const d = Date.now()
            if (ssr) {
              // can actualy not make new one all the time - just use one until it crashes
              ssr.stop()
            }
            ssr = await genWorker(result.js[0])
            await ssr.updateBuildResult(buildresult)
            console.info(
              chalk.grey('Server initialized in', Date.now() - d, 'ms')
            )
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
      // make a nice ui for this
      res.end('WAIT FOR RESULT!')
      return
    }

    const url = req.url
    const file = buildresult.files[url]

    if (file) {
      serve(res, genServeFromFile(file))
    } else {
      let result: ServeResult
      if (ssr) {
        result = genServeFromRender(await ssr.render(parseReq(req, false)))
      } else {
        const renderRes = await defaultRender(
          genRenderOpts(parseReq(req, false), buildresult)
        )
        result = genServeFromRender(renderRes)
      }

      result.contents = Buffer.concat([result.contents, browser.contents])
      result.contentLength = result.contents.byteLength

      serve(res, result)
    }
  })

  server.listen(port)

  return server
}
