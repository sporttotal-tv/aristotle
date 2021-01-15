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

// make this a solid default
export const cache: CacheFunction = (req: ParsedReq): string => {
  return req.url.href
}

export default render
