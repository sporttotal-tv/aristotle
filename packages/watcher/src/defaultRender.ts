import { RenderOpts, RenderFunction } from './types'

const render: RenderFunction = async (renderOpts: RenderOpts) => {
  return `<html>
    <head>
      <meta charset="UTF-8" />
      ${renderOpts.head}
    </head>
    <body>
      ${renderOpts.body}
    </body>
  </html>`
}

export default render
