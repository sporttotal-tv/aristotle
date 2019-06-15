const isPortFree = require('is-port-free')
const findPort = async port => {
  try {
    await isPortFree(port)
    return port
  } catch (notFree) {
    port = await findPort(++port)
    return port
  }
}

module.exports = findPort
