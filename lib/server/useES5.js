const ua = require('vigour-ua')

const useES5 = req => {
  const { browser, version } = ua(req.headers['user-agent'])
  if (
    (browser === 'edge' && version >= 15) ||
    (browser === 'firefox' && version >= 52) ||
    (browser === 'chrome' && version >= 55) ||
    (browser === 'safari' && version >= 10.3) ||
    (browser === 'opera' && version >= 42)
  ) {
    return false
  }
  return true
}

module.exports = useES5
