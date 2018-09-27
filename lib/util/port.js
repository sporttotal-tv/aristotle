const freeport = require('freeport')

const findPort = () =>
  new Promise((resolve, reject) => {
    freeport((err, port) => {
      if (err) {
        reject(err)
      } else {
        resolve(port)
      }
    })
  })

module.exports = findPort
