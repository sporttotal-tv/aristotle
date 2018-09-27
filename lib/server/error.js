const { logErrorBrowser } = require('../util/log')

const reportError = (err, init) => {
  const error = {
    message: err.message,
    stack: err.stack
  }

  var inline = ''
  inline += `var error = ${JSON.stringify(error)};\n`
  inline += logErrorBrowser.toString()
  inline += `;\nlogErrorBrowser(false, error, ${init ? 'true' : 'false'})`
  return inline
}

module.exports = reportError
