const testPx = /margin|padding/

module.exports = value => {
  if (testPx.test(value) && value.indexOf('px') === -1) {
    return value.replace(/(\d+)/, '$1px')
  }
  return value
}
