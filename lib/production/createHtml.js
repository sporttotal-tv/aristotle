// add support for adding an html page as well

const defaultServer = require('../server/default')

module.exports = (files, server) =>
  new Promise(resolve => {
    var ssr = defaultServer
    if (server) {
      const code = server.code + 'return ' + server.id
      // eslint-disable-next-line
      ssr = new Function('require', code)(require)
    }

    let resolved = false

    const timer = setTimeout(() => {
      console.log(
        '🤷‍♂️ Cannot execute ssr function within 500ms switch do no generate html file'
      )
      resolved = true
      resolve('<html>RUN SERVER FOR THIS PROJECT!</html>')
    }, 500)

    ssr({ url: '/' }, files).then(html => {
      if (!resolved) {
        clearTimeout(timer)
        resolve(html)
      }
    })
  })
