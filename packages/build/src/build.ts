import createBuild from './createBuild'
import parseBuild from './parseBuild'

const build = async opts => {
  const { result, styles, dependencies } = await createBuild(opts, false)
  return parseBuild(opts, result, styles, dependencies)
}

export default build
