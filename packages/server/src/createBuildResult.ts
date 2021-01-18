import { BuildResult, File } from '@saulx/aristotle-build'
import { BuildJson, BuildJsonFile } from '@saulx/aristotle-server-utils'
import fs from 'fs'
import util from 'util'
import { join, dirname } from 'path'

const readFile = util.promisify(fs.readFile)

export default async (buildJson: string): Promise<BuildResult> => {
  const parsedBuildJson: BuildJson = JSON.parse(
    await readFile(buildJson, { encoding: 'utf-8' })
  )
  const { files, env, js, css, entryPoints, dependencies } = parsedBuildJson

  const parsedFiles: { [key: string]: File } = {}

  const loadFile = async (file: BuildJsonFile) => {
    const { contents, ...rest } = file
    const buffer: Buffer = await readFile(join(dirname(buildJson), contents))
    parsedFiles[file.url] = new File({
      ...rest,
      contents: buffer
    })
  }
  const q = []
  for (const key in files) {
    q.push(loadFile(files[key]))
  }
  await Promise.all(q)

  const buildResult: BuildResult = {
    files: parsedFiles,
    js: js.map(file => parsedFiles[file]),
    css: css.map(file => parsedFiles[file]),
    env,
    entryPoints,
    errors: [],
    dependencies
  }

  return buildResult
}
