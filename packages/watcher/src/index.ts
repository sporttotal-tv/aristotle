import chalk from 'chalk'
import { v4 } from 'internal-ip'
import http from 'http'
import getPort from 'get-port'
import startLiveReload from './livereload'
import genRenderOpts from './genRenderOpts'
import build, {
  BuildError,
  BuildOpts,
  BuildResult,
  File
} from '@saulx/aristotle-build'
import defaultRender from './defaultRenderer'
import { genServeFromFile, genServeFromRender } from './genServeResult'
import serve from './serve'
import hasServer from './hasServer'
import { genWorker, RenderWorker } from './worker/serverWorker'
import parseReq from './parseReq'
import { ServeResult } from './types'
import fs from 'fs'
import { join } from 'path'
import { genErrorPage, AristotleError } from './errorHandling'

const loadingHtml = fs.readFileSync(join(__dirname, '../static/loading.html'))

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
    platform: 'browser',
    sourcemap: true
  }

  const { update, browser } = startLiveReload(reloadPort)

  await console.info(
    chalk.blue('Aristotle development server'),
    'http://' + ip + ':' + port
  )

  const serverTarget = await hasServer(target)

  console.info('  browser', chalk.grey(target))

  let buildresult: BuildResult
  let renderer: RenderWorker
  let rendererBeingBuild: string
  let rendererFiles: { [key: string]: File } = {}
  let rendererError: AristotleError
  let buildErrors: AristotleError[] | undefined
  let serverBuildErrors: AristotleError[] | undefined

  const setBuildErrors = (build: BuildResult): AristotleError[] => {
    return build.errors.map(
      (err: BuildError): AristotleError => {
        return {
          type: 'build',
          build,
          buildError: err
        }
      }
    )
  }

  build(buildOpts, async result => {
    if (result.errors.length) {
      buildErrors = setBuildErrors(result)
      update()
    } else {
      buildErrors = undefined
      // compare all checksums and lengths
      buildresult = result
      if (rendererBeingBuild) {
        console.info(chalk.grey('Server rebuild in progress...'))
      } else {
        if (renderer) {
          for (let key in rendererFiles) {
            if (!result.files[key]) {
              result.files[key] = rendererFiles[key]
            }
          }
          await renderer.updateBuildResult(buildresult)
        }
        update()
      }
    }
  })

  if (serverTarget) {
    console.info('  server ', chalk.grey(serverTarget))
    const buildOptsServer: BuildOpts = {
      entryPoints: [serverTarget],
      platform: 'node',
      sourcemap: true
    }
    if (serverTarget) {
      // make this into a fucntion
      build(buildOptsServer, async result => {
        if (result.errors.length) {
          serverBuildErrors = setBuildErrors(result)
          update()
        } else {
          serverBuildErrors = undefined
          rendererFiles = {}
          for (let key in result.files) {
            const file = result.files[key]
            if (
              file.mime.split('/')[0] !== 'application' &&
              file.mime !== 'text/css'
            ) {
              rendererFiles[key] = file
              if (buildresult) {
                buildresult.files[key] = file
              }
            }
          }

          const checksum = result.js[0].checksum
          rendererError = undefined
          if (rendererBeingBuild === checksum) {
            // console.log('change with no update - ignore', checksum)
          } else {
            rendererBeingBuild = checksum
            const d = Date.now()

            const makeSsr = async () => {
              renderer = await genWorker(result)
              renderer.once('error', async err => {
                console.log(chalk.red('Server crashed'), err.message)
                renderer.stop()
                rendererError = {
                  type: 'runtime',
                  error: err,
                  build: renderer.build
                }
                renderer = undefined
                update()
              })
              await renderer.updateBuildResult(buildresult)
              console.info(
                chalk.grey('Server initialized in', Date.now() - d, 'ms')
              )
              rendererBeingBuild = undefined
              update()
            }

            if (!renderer || checksum !== renderer.checksum) {
              if (renderer) {
                try {
                  await renderer.updatecode(result)
                  await renderer.updateBuildResult(buildresult)
                  console.info(
                    chalk.grey('Server updated in', Date.now() - d, 'ms')
                  )
                  rendererBeingBuild = undefined
                  update()
                } catch (err) {
                  renderer.stop()
                  rendererBeingBuild = undefined
                  makeSsr()
                }
              } else {
                makeSsr()
              }
            }
          }
        }
      })
    }
  }

  console.info('')

  const server = http.createServer(async (req, res) => {
    if (!buildresult) {
      res.end(loadingHtml + browser.contents.toString())
      return
    }

    const url = req.url
    const file = buildresult.files[url]

    // if build errors (also for server)

    if (file) {
      serve(res, genServeFromFile(file))
    } else {
      const parsedReq = parseReq(req, false)
      let result: ServeResult
      let bErrors = serverBuildErrors || buildErrors
      if (bErrors) {
        genRenderOpts(parsedReq, buildresult)
        result = genServeFromRender(await genErrorPage(...bErrors))
      } else if (renderer || rendererError) {
        let error: AristotleError
        if (!rendererError) {
          try {
            const renderResult = await renderer.render(parsedReq)
            if (renderResult !== null) {
              result = genServeFromRender(renderResult)
            }
          } catch (err) {
            error = {
              type: 'render',
              error: err,
              build: renderer.build,
              parsedReq
            }
          }
        } else {
          error = rendererError
        }
        if (error) {
          genRenderOpts(parsedReq, buildresult)
          result = genServeFromRender(await genErrorPage(error))
        }
      } else {
        const renderRes = await defaultRender(
          genRenderOpts(parsedReq, buildresult)
        )
        result = genServeFromRender(renderRes)
      }
      if (result) {
        result.contents = Buffer.concat([result.contents, browser.contents])
        result.contentLength = result.contents.byteLength
        serve(res, result)
      } else {
        req.destroy()
      }
    }
  })

  server.listen(port)

  return server
}
