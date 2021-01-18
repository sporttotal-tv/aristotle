import { BuildResult, File } from '@saulx/aristotle-build'
import { BuildJson } from '@saulx/aristotle-server-utils'
import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)

export default async (buildJson: string): Promise<BuildResult> => {
  const parsedBuildJson: BuildJson = JSON.parse(
    await readFile(buildJson, { encoding: 'utf-8' })
  )
  const { files, env, js, css, entryPoints } = parsedBuildJson

  const parsedFiles: File[] = []

  for (let key in files) {
    // if extension is .gz
    // parse mime types again... can also add all this meta info in the build result files entry
  }

  const buildResult: BuildResult = {
    // files:
  }
}
