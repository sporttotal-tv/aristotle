import { BuildResult, File } from '@saulx/aristotle-build'
import { ParsedReq } from '../types'

export type AristotleError = {
  type: 'render' | 'runtime' | 'build'
  error: Error
  build?: BuildResult
  parsedReq?: ParsedReq
}

const parseError = (error: AristotleError): string => {
  const type =
    error.type === 'render'
      ? 'server render error'
      : error.type === 'runtime'
      ? 'server runtime error'
      : 'build error'

  return `<div class="error">
    <div class="inner">
      <div class="type">${type}</div>
      <div class="title">${error.error.message}</div>
    </div>
    
  </div>`
}

export const genErrorPage = (...errors: AristotleError[]): string => {
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
       ${errors.map(err => parseError(err))}
    </body>
  </html>`
}
