// middle ware or not to middle ware
const fs = require('fs')
const http = require('http')
const chalk = require('chalk')
const WebSocket = require('ws')
const defaultServer = require('./default')
const mime = require('mime-types')
const hash = require('string-hash')
const handleError = require('./error')
const { join, extname } = require('path')
const findPort = require('../util/port')
const ip = require('ip')

const createLiveReload = port => {
  return {
    path: '/livereload.js',
    contents: `
    var host = window.location.hostname
    var socket = new WebSocket('ws://' + host + ':${port}')
    socket.addEventListener('message', function (event) {
      var data = JSON.parse(event.data)
      if (data.type === 'error') {
        console.log(data)
        logErrorBrowser()
      } else if (data.type === 'reload') {
        location.reload()
      }
    })
  `
  }
}

const pending = (req, res) => res.end('<html><body>compiling...</body></html>')

module.exports = async (store, port, path) => {
  // find freeport
  const wsPort = await findPort()
  const wss = new WebSocket.Server({ port: wsPort })
  const livereload = createLiveReload(wsPort)

  var files = { livereload }
  var pathMap = {}
  var ssr = pending
  var lastServer

  wss.broadcast = data => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  const createFile = file => {
    return {
      contents: file.contents,
      length: Buffer.byteLength(file.contents),
      mime: mime.lookup(file.path)
    }
  }

  const reportServerError = (err, init) => {
    console.trace(err)
    console.log(chalk.red(`🛸  SSR error "${err.message}"`))
    const contents = handleError(err, init)
    const path = `/${hash(contents)}.js`
    files.js = { contents, path }
    pathMap[path] = createFile(files.js)
  }

  const update = (clientFiles, server, error) => {
    files = clientFiles
    files.livereload = livereload
    pathMap = {}
    for (let key in files) {
      pathMap[files[key].path] = createFile(files[key])
    }
    if (server && !Object.keys(error).length) {
      const code = server.code + 'return ' + server.id
      if (lastServer !== server.codeHash) {
        // eslint-disable-next-line
        if (!lastServer) {
          console.log(
            chalk.magenta(`🛸️  SSR function from file ${server.path}`)
          )
        }
        try {
          // eslint-disable-next-line
          ssr = new Function('require', code)(require)
          lastServer = server.codeHash
        } catch (err) {
          lastServer = void 0
          reportServerError(err, true)
          ssr = defaultServer
          lastServer = void 0
        }
      }
    } else {
      lastServer = void 0
      ssr = defaultServer
    }

    wss.broadcast({ type: 'reload' })
  }

  const serveSSR = async (req, res) => {
    try {
      const r = await ssr(req, files)
      res.end(r + '<script src="/livereload.js"></script>')
    } catch (err) {
      lastServer = void 0
      reportServerError(err)
      const r = await defaultServer(req, files)
      res.end(r + '<script src="/livereload.js"></script>')
    }
  }

  http
    .createServer(async (req, res) => {
      if (pathMap[req.url]) {
        const val = pathMap[req.url]
        res.setHeader('access-control-allow-origin', '*')
        res.setHeader('content-length', val.length)
        res.setHeader('content-type', val.mime)
        res.end(val.contents)
      } else if (extname(req.url)) {
        const { pkgDir } = store.resolved[path]
        const file = join(pkgDir, req.url)
        fs.stat(file, async (err, data) => {
          if (err) {
            await serveSSR(req, res)
          } else {
            res.writeHead(200, {
              'Content-Type': mime.lookup(file),
              'Content-Length': data.size
            })
            fs.createReadStream(file).pipe(res)
          }
        })
      } else {
        // ssr in isolated process to say when it hangs
        await serveSSR(req, res)
      }
    })
    .listen(port)
  console.log('')
  const addres = `http://${ip.address()}:${port}`
  console.log(chalk.magenta(`🛸  Dev server listening on ${addres}`))
  console.log('')
  return update
}
