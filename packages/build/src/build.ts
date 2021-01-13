import createBuild from './createBuild'
import parseBuild from './parseBuild'

const build = async opts => {
  const { result, files, dependencies } = await createBuild(opts, false)
  return parseBuild(opts, result, files, dependencies)
}

export default build
