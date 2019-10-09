const { getPackagePath } = require('@saulx/get-package')
exports.findPkg = p => {
  console.log(p)
  return getPackagePath(p, true)
}
