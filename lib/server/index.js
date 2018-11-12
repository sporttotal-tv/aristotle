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

    var connect = function (timeout) {
      if (!timeout) {
        timeout = 0
      }
      setTimeout(function () {
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
        socket.addEventListener('open', function (event) {
          if (timeout > 0) {
            location.reload()
          }
          console.log('🛸 dev server connected')
        })
        socket.addEventListener('close', function (event) {
          console.log('🛸 dev server reconnecting...')
          connect(Math.min(timeout + 1000), 3000)
        })
      }, timeout)
    }
    connect()
  `
  }
}

module.exports = async (store, port, path) => {
  // find freeport
  const wsPort = await findPort(8888)
  const wss = new WebSocket.Server({ port: wsPort })
  const livereload = createLiveReload(wsPort)

  var files = { livereload }

  var pathMap = {}
  var ssr
  var lastServer
  var initial = false
  var ssrCode

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

  for (let key in files) {
    pathMap[files[key].path] = createFile(files[key])
  }

  const reportServerError = (err, init, errors, code = '') => {
    // console.trace(err)
    if (err && !err.notReady) {
      console.log(chalk.red(`🛸  SSR error "${err.message}"`))
    } else if (errors) {
      console.log(chalk.red(`🛸  Build errors`))
    }
    const contents = handleError(err, init, code, errors)
    const path = `/${hash(contents)}.js`
    files.js = { contents, path }
    pathMap[path] = createFile(files.js)
  }

  const update = (clientFiles, server, error) => {
    console.log('')
    const addres = `http://${ip.address()}:${port}`
    console.log(chalk.magenta(`🛸  Dev server listening on ${addres}`))
    console.log('')

    files = clientFiles
    files.livereload = livereload
    pathMap = {}
    for (let key in files) {
      pathMap[files[key].path] = createFile(files[key])
    }
    if (server && !Object.keys(error).length) {
      const code = (ssrCode = server.code + 'return ' + server.id)
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
          reportServerError(err, true, false, ssrCode)
          ssr = defaultServer
          lastServer = void 0
        }
      }
    } else {
      if (Object.keys(error).length) {
        reportServerError(false, false, error)
      }
      lastServer = void 0
      ssr = defaultServer
    }
    initial = true

    wss.broadcast({ type: 'reload' })
  }

  const serveSSR = async (req, res) => {
    if (initial) {
      try {
        const r = await ssr(req, files)
        res.end(r + '<script src="/livereload.js"></script>')
      } catch (err) {
        lastServer = void 0
        reportServerError(err, false, false, ssrCode)
        const r = await defaultServer(req, files, ssr)
        res.end(r + '<script src="/livereload.js"></script>')
      }
    } else {
      reportServerError({ notReady: true, message: 'Compiling...' })
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
            if (req.url.indexOf('favicon') !== -1) {
              res.end('')
            } else {
              await serveSSR(req, res)
            }
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

  return update
}
