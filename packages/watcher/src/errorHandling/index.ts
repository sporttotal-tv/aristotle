import { BuildResult, File } from '@saulx/aristotle-build'
import { ParsedReq } from '../types'

import { SourceMapConsumer } from 'source-map'

import { join } from 'path'

export type AristotleError = {
  type: 'render' | 'runtime' | 'build'
  error: Error
  build?: BuildResult
  parsedReq?: ParsedReq
}

const parseError = async (error: AristotleError): string => {
  const type =
    error.type === 'render'
      ? 'server render error'
      : error.type === 'runtime'
      ? 'server runtime error'
      : 'build error'

  let isServer = error.type === 'render' || error.type === 'runtime'

  if (isServer) {
    const map = error.build.files['/server.js.map'].contents.toString()
    // console.log(map)

    const x = JSON.parse(map)

    x.sourceRoot = join(__dirname, '../../test')

    console.log(x)

    const consumer = await new SourceMapConsumer(x)

    consumer.eachMapping(function(m) {
      // console.log(m)
    })

    console.log(
      consumer.hasContentsOfAllSources(),
      consumer.originalPositionFor({
        line: 5,
        column: 10
      })
    )
  }

  return `<div class="error">
    <div class="inner">
      <div class="type">${type}</div>
      <div class="title">${error.error.message}</div>
    </div>
    
  </div>`
}

export const genErrorPage = async (
  ...errors: AristotleError[]
): Promise<string> => {
  return `<html>
    <head>
      <style>
        body {
          padding: 25px;
        }
        .inner {
          display: flex;
          align-items: center;
        }
        .error {
          marginBottom: 15px;
        }
        .title {
          margin-left: 15px;
        }
        .type {
          padding: 7.5px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: #333;
          background-color: #eee;
        }
      </style>
    </head>
    <body>
       ${await Promise.all(errors.map(err => parseError(err)))}
    </body>
  </html>`
}
