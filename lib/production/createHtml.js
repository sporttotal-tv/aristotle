// add support for adding an html page as well

const defaultServer = require('../server/default')

module.exports = async (files, server) => {
  var ssr = defaultServer
  if (server) {
    const code = server.code + 'return ' + server.id
    // eslint-disable-next-line
    ssr = new Function('require', code)(require)
  }

  const html = await ssr({ url: '/' }, files)
  return html
}
