const { getPackagePath } = require('@saulx/get-package')
exports.findPkg = async p => {
  console.log('--------->', p, await getPackagePath(p))
  return getPackagePath(p)
}
