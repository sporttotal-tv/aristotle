const hash = require('string-hash')

const rewriteModule = (module, member) => {
  module = hash(module).toString(36)
  return (member ? `MODULE_${module}_${member}` : `MODULE_${module}`).replace(
    /[-.!@#$%^&*(){}|?\\/~`"'<>]/g,
    ''
  )
}

exports.rewriteModule = rewriteModule
