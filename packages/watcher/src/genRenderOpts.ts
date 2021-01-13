import { RenderOpts } from './types'
import { BuildResult } from '@saulx/aristotle-build'
import http from 'http'

export default (req: http.IncomingMessage, build: BuildResult): RenderOpts => {
  const renderOpts: RenderOpts = {
    body: '',
    head: '',
    env: build.env,
    envFile: '',
    js: build.js,
    css: build.css,
    files: build.files,
    url: req.url,
    queryString: '', // make this a getter maybe? and a class
    language: '',
    userAgent: {
      device: '',
      browser: '',
      version: 0
    }
  }

  return renderOpts
}
