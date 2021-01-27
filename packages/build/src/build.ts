import createBuild from './createBuild'
import parseBuild from './parseBuild'
import { BuildOpts } from './'
import { BuildResult } from '@saulx/aristotle-types'

const build = async (opts: BuildOpts): Promise<BuildResult> => {
  const { result, meta } = await createBuild(opts, false)
  return parseBuild(opts, result, meta)
}

export default build
