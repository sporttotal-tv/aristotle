import { RenderOpts, ParsedReq } from './types'
import { BuildResult } from '@saulx/aristotle-types'
import genEnvfile from './genEnvfile'

export default (req: ParsedReq, build: BuildResult): RenderOpts => {
  const envFile = genEnvfile(build.env || [])

  const renderOpts: RenderOpts = {
    ...req,
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
    files: build.files
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
