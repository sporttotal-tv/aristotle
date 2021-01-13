import createBuild from './createBuild'
import parseBuild from './parseBuild'

const build = async opts => {
  const { result, styles } = await createBuild(opts, false)
  return parseBuild(result, styles)
}

export default build
