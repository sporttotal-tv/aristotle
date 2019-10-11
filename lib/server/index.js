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
const useES5 = require('./useES5')
const ua = require('vigour-ua')
const { fork } = require('child_process')

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
      mime: /\.es5$/.test(file.path)
        ? 'application/javascript'
        : mime.lookup(file.path)
    }
  }

  for (const key in files) {
    pathMap[files[key].path] = createFile(files[key])
  }

  const reportServerError = (err, init, errors, code = '') => {
    // console.trace(err)
    if (err && !err.notReady) {
      console.log('')
      console.log(chalk.red(`🛸  SSR error "${err.message}"`))
    } else if (errors) {
      console.log(chalk.red(`🛸  Build errors`))
    }
    const contents = handleError(err, init, code, errors)

    const path = `/${hash(contents)}.js`
    files.js = { contents, path }
    pathMap[path] = createFile(files.js)
  }

  let child = false

  const update = (clientFiles, server, error) => {
    console.log('')
    const addres = `http://${ip.address()}:${port}`
    console.log(chalk.magenta(`🛸  Dev server listening on ${addres}`))
    console.log('')

    files = clientFiles

    files.livereload = livereload
    pathMap = {}
    for (const key in files) {
      pathMap[files[key].path] = createFile(files[key])
      if (key === 'js') {
        pathMap['/bundle.js'] = pathMap[files[key].path]
      }
      if (key === 'es5') {
        pathMap['/bundle.es5.js'] = pathMap[files[key].path]
      }
      if (key === 'css') {
        pathMap['/bundle.css'] = pathMap[files[key].path]
      }
    }

    if (server && !Object.keys(error).length) {
      if (lastServer !== server.codeHash + (files.css ? files.css.path : '')) {
        // eslint-disable-next-line
        if (!lastServer) {
          console.log(
            chalk.magenta(`🛸️  SSR function from file ${server.path}`)
          )
        }
        try {
          // eslint-disable-next-line
          // const options = {
          //   vm: true,
          //   silent: true
          // }

          const options = {
            // vm: true,
            // stdio: ['pipe', 'pipe', 'pipe', 'ipc']
          }

          if (child) {
            console.log('Kill previous child process ☠️')
            child.kill('SIGINT')
          }

          child = fork(join(__dirname, 'fork.js'), [], options)

          let isReady = false
          let q = []
          const incoming = {}
          let seqId = 0

          const receive = (payload, resolve) => {
            const seq = seqId++
            child.send(
              JSON.stringify({
                type: 'request',
                payload,
                seq
              })
            )
            incoming[seq] = resolve
          }

          const d = Date.now()

          child.on('message', msg => {
            // console.log('--------> incoming from child!')
            try {
              const obj = JSON.parse(msg)

              if (obj.type === 'error') {
                // console.log('-------------------------------')
                // console.log(chalk.red(`SSR Initialization error`))
                // console.log(obj.err.message)
                isReady = true
                q.forEach(([payload, resolve]) => {
                  receive(payload, resolve)
                })
                q = []
                const resolve = incoming[obj.seq]
                if (resolve) {
                  obj.err.type = 'error'
                  resolve(obj.err)
                }
              } else if (obj.type === 'init') {
                console.log(
                  chalk.blue(`Initialized SSR code in ${Date.now() - d} ms`)
                )
                console.log('-------------------------------')
                isReady = true
                q.forEach(([payload, resolve]) => {
                  receive(payload, resolve)
                })
                q = []
              } else if (obj.type === 'response') {
                const resolve = incoming[obj.seq]
                if (resolve) {
                  resolve(obj.response)
                }
              }
            } catch (err) {
              console.log('invalid payload from childprocess')
            }
          })

          ssrCode = server.code + `;global.ssr = ${server.id};`

          child.send(
            JSON.stringify({
              code: ssrCode
            })
          )

          ssr = (req, files, ua) =>
            new Promise(resolve => {
              const payload = JSON.stringify({
                req: {
                  url: req.url,
                  headers: req.headers,
                  rawHeaders: req.headers,
                  path: req.path
                },
                files: {
                  css: files.css,
                  js: { path: files.js.path }
                },
                ua
              })
              if (!isReady) {
                console.log('still loading add to queue')
                q.push([payload, resolve])
              } else {
                receive(payload, resolve)
              }
            })

          lastServer = server.codeHash + (files.css ? files.css.path : '')
        } catch (err) {
          lastServer = undefined
          reportServerError(err, true, false, ssrCode)
          ssr = defaultServer
          lastServer = undefined
        }
      }
    } else {
      if (Object.keys(error).length) {
        reportServerError(false, false, error)
      }
      lastServer = undefined
      ssr = defaultServer
    }
    initial = true

    // need something for rnative as well...
    wss.broadcast({ type: 'reload' })
  }

  const serveSSR = async (req, res) => {
    if (initial) {
      try {
        const userAgent = req.headers['user-agent'] || ''
        const r = (await ssr(req, files, ua(userAgent))) || ''

        if (typeof r === 'object') {
          if (r.statusCode) {
            res.statusCode = r.statusCode
          }
          if (r.type === 'error') {
            reportServerError(r, false, false, ssrCode)
            const re = (await defaultServer(req, files, ssr)) || ''
            res.end(
              re.replace(
                '</html>',
                '<script src="/livereload.js"></script></html>'
              )
            )
          } else {
            res.end(
              (r.response && r.response).replace(
                '</html>',
                '<script src="/livereload.js"></script></html>'
              )
            )
          }
        } else {
          res.end(
            r.replace(
              '</html>',
              '<script src="/livereload.js"></script></html>'
            )
          )
        }
      } catch (err) {
        lastServer = undefined

        reportServerError(err, false, false, ssrCode)
        const r = (await defaultServer(req, files, ssr)) || ''
        res.end(
          r.replace('</html>', '<script src="/livereload.js"></script></html>')
        )
      }
    } else {
      reportServerError({ notReady: true, message: 'Compiling...' })
      const r = (await defaultServer(req, files)) || ''
      res.end(
        r.replace('</html>', '<script src="/livereload.js"></script></html>')
      )
    }
  }

  http
    .createServer(async (req, res) => {
      res.setHeader('access-control-allow-origin', '*')
      let url = req.url
      let mappedFile = pathMap[req.url]
      if (!mappedFile && /.{1,100}\/.{1,100}\..{1,30}$/.test(req.url)) {
        const fileName = req.url.split('/')
        const mappedFileName = '/' + fileName[fileName.length - 1]
        mappedFile = pathMap['/' + fileName[fileName.length - 1]]
        if (mappedFile) {
          url = mappedFileName
        }
      }
      if (mappedFile) {
        let val = mappedFile
        if (val.mime === 'application/javascript') {
          const isEs5 = useES5(req)
          if (isEs5) {
            val = pathMap[url + '.es5'] || val
          }
        }
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
