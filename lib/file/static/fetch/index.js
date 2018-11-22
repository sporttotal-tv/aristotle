// conditional build for this
// only add if nessecary
if (!global.fetch) {
  global.fetch = require('cross-fetch')
}
