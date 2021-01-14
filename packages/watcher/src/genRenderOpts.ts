import { RenderOpts } from './types'
import { BuildResult } from '@saulx/aristotle-build'
import http from 'http'
import genEnvfile from './genEnvfile'

export default (req: http.IncomingMessage, build: BuildResult): RenderOpts => {
  const envFile = genEnvfile(build.env || [])

  const renderOpts: RenderOpts = {
    body: `${build.js
      .map(file => {
        return `<script src="${file.url}"></script>`
      })
      .join('')}`,
    envFile,
    head: envFile ? `<script>${envFile}</script>` : '',
    env: build.env,
    js: build.js,
    css: build.css,
    files: build.files,
    url: req.url,
    queryString: '', // make this a getter maybe? and a class
    language: '',
    ip: '',
    domain: '',
    es5browser: false,
    headers: {},
    userAgent: {
      device: '',
      browser: '',
      version: 0
    }
  }

  if (build.css.length) {
    renderOpts.head += `<style>${build.css
      .map(file => {
        return file.text
      })
      .join('')}</style>`
  }

  return renderOpts
}
