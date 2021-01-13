import createBuild from './createBuild'
import parseBuild from './parseBuild'

const build = async opts => {
  const { result, styles, dependencies } = await createBuild(opts, false)
  return parseBuild(result, styles, dependencies)
}

export default build
