import { RenderOpts, RenderFunction, CacheFunction } from './types'

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

export const cache: CacheFunction = (renderOpts: RenderOpts): string => {
  // do something (or send renderOpts)
  return 'lulls'
}

export default render
