// add support for adding an html page as well

const defaultServer = require('../server/default')

module.exports = (files, server, d) =>
  new Promise(resolve => {
    var ssr = defaultServer

    let resolved = false

    const timer = setTimeout(() => {
      console.log(
        "🤷‍♂️ Cannot execute ssr function within 500ms - don't generate html file"
      )
      resolved = true
      resolve('<html>RUN SERVER FOR THIS PROJECT!</html>')
    }, 500)

    if (server) {
      const code = server.code + 'return ' + server.id
      // eslint-disable-next-line
      ssr = new Function('require', '__dirname', code)(require, d)
    }

    if (ssr) {
      try {
        ssr({ url: '/' }, files)
          .then(html => {
            if (!resolved) {
              clearTimeout(timer)
              resolve(html)
            }
          })
          .catch(err => {
            console.log('Error running ssr', err.message)
            if (!resolved) {
              resolve('<html>RUN SERVER FOR THIS PROJECT!</html>')
            }
          })
      } catch (err) {
        console.log('Did not produce an html page')
        clearTimeout(timer)
        if (!resolved) {
          resolve('<html>RUN SERVER FOR THIS PROJECT!</html>')
        }
      }
    }
  })
