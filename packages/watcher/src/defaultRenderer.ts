import { RenderOpts, RenderFunction, CacheFunction, ParsedReq } from './types'

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

export const cache: CacheFunction = (req: ParsedReq): string => {
  return 'lulls'
}

export default render
