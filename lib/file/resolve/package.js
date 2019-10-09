const { getPackagePath } = require('@saulx/get-package')
exports.findPkg = p => {
  console.log(p, getPackagePath)
  return getPackagePath(p)
}
