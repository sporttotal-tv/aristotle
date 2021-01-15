import createBuild from './createBuild'
import parseBuild from './parseBuild'

const build = async opts => {
  const { result, meta } = await createBuild(opts, false)
  return parseBuild(opts, result, meta)
}

export default build
