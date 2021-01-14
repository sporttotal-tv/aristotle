import { BuildError, BuildResult } from '@saulx/aristotle-build'
import { ParsedReq } from '../types'
import escape from 'escape-html'
import { SourceMapConsumer } from 'source-map'
import { join, dirname } from 'path'
import fs from 'fs'
import util from 'util'

const readfile = util.promisify(fs.readFile)

export type AristotleError = {
  type: 'render' | 'runtime' | 'build'
  error?: Error
  buildError?: BuildError
  build?: BuildResult
  parsedReq?: ParsedReq
}

// now highlight

const fillChar = (column: number): string => {
  let str = ''
  for (let i = 0; i < column; i++) {
    str += '&nbsp'
  }
  str += '^'
  return str
}

const parseFile = (source: {
  line: number
  column: number
  source: string
  code: string
}): string => {
  const lines = source.code.split('\n')

  const s = Math.max(0, source.line - 10)
  const l = Math.min(source.line + 10, lines.length)

  const parsedLines = []
  for (let i = s; i < l; i++) {
    if (i === source.line) {
      parsedLines.push(
        `<div class="line wrong"><div class="nr">${i + 1}</div><div>${escape(
          lines[i]
        )}</div></div>`
      )
      parsedLines.push(
        `<div class="line wrong"><div class="nr">&nbsp</div><div>${fillChar(
          source.column
        )}</div></div>`
      )
    } else {
      parsedLines.push(
        `<div class="line"><div class="nr">${i + 1}</div><div>${escape(
          lines[i]
        )}</div></div>`
      )
    }
  }

  return `<div class="code">${parsedLines.join('\n')}</div>`
}

const parseError = async (error: AristotleError): Promise<string> => {
  const type =
    error.type === 'render'
      ? 'server render error'
      : error.type === 'runtime'
      ? 'server runtime error'
      : 'build error'

  let isServer = error.type === 'render' || error.type === 'runtime'

  let code = ''
  let file = ''
  let fullpath = ''

  if (isServer) {
    const mapfile =
      error.build.files['/server.js.map'] ||
      error.build.files['/server/index.js.map']
    const map = mapfile.contents.toString()
    const parsedMap = JSON.parse(map)
    const match = error.error.stack.match(/app-server:(\d+:\d+)/)
    if (match) {
      const lines = match[1].split(':')
      const source = await SourceMapConsumer.with(parsedMap, null, consumer => {
        return consumer.originalPositionFor({
          line: Number(lines[0]) - 1,
          column: Number(lines[1]) - 1
        })
      })
      const entry = error.build.entryPoints[0]
      file = source.source
      const path = join(dirname(entry), source.source)
      fullpath = `${path}:${source.line + 1}:${source.column}`
      code = parseFile({
        source: source.source,
        line: source.line,
        column: source.column,
        code: await readfile(path, { encoding: 'utf8' })
      })
    }
    return `<a class="error" href="vscode://file${fullpath}">
    <div class="type">${type}</div>
      <div class="bar" >
        <div>${error.error.message}</div>
        <div>${file}</div>
      </div>
      ${code}
    </a>`
  } else if (error.type === 'build') {
    file = error.buildError.location.file
    const entry = error.build.entryPoints[0]
    const path = join(dirname(entry), '../', file)
    fullpath = `${path}:${error.buildError.location.line}:${error.buildError.location.column}`
    code = parseFile({
      source: file,
      line: error.buildError.location.line - 1,
      column: error.buildError.location.column - 1,
      code: await readfile(path, { encoding: 'utf8' })
    })
    return `<a class="error" href="vscode://file${fullpath}">
    <div class="type">${type}</div>
      <div class="bar" >
        <div>${error.buildError.text}</div>
        <div>${file}</div>
      </div>
      ${code}
    </a>`
  }
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
        .bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          margin-top: 20px;
          background-color: #ccc;
          font-family: Andale Mono;
          font-size: 12px;
         
        }
        .error:hover > .bar {
          background-color: #000;
          color: white;
        }
        .error {
          marginBottom: 20px;
          text-decoration: none;
          color: inherit;
        }
        .line {
          display: flex;
          align-items: center;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        .wrong {
          color: red;
        }
        .nr {
          padding-right: 20px;
        }
        .code {
          font-size: 12px;
          background-color: #eee;
          padding: 10px;
          color: #000;
          font-family: Andale Mono;
        }
        .type {
          font-size: 18px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
       ${await Promise.all(errors.map(err => parseError(err)))}
    </body>
  </html>`
}
