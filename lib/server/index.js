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
const path = require('path')
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

  for (let key in files) {
    pathMap[files[key].path] = createFile(files[key])
  }

  const reportServerError = (err, init, errors, code = '') => {
    // console.trace(err)
    if (err && !err.notReady) {
      console.log(chalk.red(`🛸  SSR error "${err.message}" "${err.stack}"`))
    } else if (errors) {
      console.log(chalk.red(`🛸  Build errors`))
    }
    const contents = handleError(err, init, code, errors)

    const path = `/${hash(contents)}.js`
    files.js = { contents, path }
    pathMap[path] = createFile(files.js)
  }

  let seqId = 0
  let child = false

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
      if (lastServer !== server.codeHash) {
        let q = []

        // eslint-disable-next-line
        if (!lastServer) {
          console.log(
            chalk.magenta(`🛸️  SSR function from file ${server.path}`)
          )
        }
        try {
          const endIndicator = '__$$$END__'
          const startIndicator = '__$$$START__'
          // eslint-disable-next-line
          const options = {
            vm: true,
            silent: true
          }

          if (child) {
            console.log('Kill previous child process ☠️')
            child.kill('SIGINT')
          }

          let emit = {}
          child = fork(join(__dirname, 'fork.js'), [], options)

          // also needs to have complete results
          let chunkedData = ''
          let isReceiving
          let ready = false

          const receiveData = data => {
            if (!ready) {
              console.log(data)
              if (data.indexOf('Initialized ssr code successfully ✓') !== -1) {
                q.forEach(v => {
                  child.stdin.write(v)
                })
                q = []
                ready = true
              }
            } else {
              const isStart = data.indexOf(startIndicator) === 0
              if (isReceiving || isStart) {
                isReceiving = true
                if (isStart) {
                  chunkedData += data.slice(startIndicator.length)
                } else {
                  chunkedData += data
                }
                if (/__\$\$\$END__$/.test(chunkedData)) {
                  let result = chunkedData.slice(0, -endIndicator.length)
                  chunkedData = ''
                  isReceiving = false
                  try {
                    const obj = JSON.parse(result)
                    if (emit[obj.seq]) {
                      emit[obj.seq](null, obj.content)
                      delete emit[obj.seq]
                    }
                  } catch (err) {
                    console.log('❗️ Cannot parse json', result)
                  }
                }
              } else {
                const sIndex = data.indexOf(startIndicator)
                if (sIndex !== -1) {
                  const d = data.slice(sIndex, -1)
                  receiveData(d)
                  data = data.slice(0, sIndex)
                }
                try {
                  const obj = JSON.parse(data)
                  console.log(obj)
                } catch (e) {
                  console.log(data)
                }
              }
            }
          }

          child.stdin.write(
            server.code +
              `
              global.ssr = ${server.id};_____________ENDCODE_____________`
          )

          child.stdout.on('data', d => receiveData(d.toString()))

          child.stderr.on('data', err => {
            try {
              const r = JSON.parse(err.toString())
              if (r.seq) {
                if (emit[r.seq]) {
                  emit[r.seq](r.err)
                  console.log('❗️', r.err)
                  reportServerError(r.err, false, false)
                  delete emit[r.seq]
                }
              } else {
                if (r.fatal) {
                  child.kill('SIGINT')
                  lastServer = void 0
                  reportServerError({ message: r.err, stack: '' }, false, false)
                  ssr = defaultServer
                  lastServer = void 0
                  wss.broadcast({ type: 'reload' })
                } else {
                  console.log('❗️', r)
                  reportServerError(r.err, true, false)
                }
              }
            } catch (e) {
              console.log('❗️', err.toString())
            }
          })

          // You can send a callback if you want, and it's simple !
          child.on('close', code => {
            console.log('Child process closed')
          })

          ssr = (req, files, ua) =>
            new Promise((resolve, reject) => {
              var seq = ++seqId
              const args = JSON.stringify({
                seq,
                args: [
                  {
                    url: req.url,
                    headers: req.headers,
                    rawHeaders: req.headers,
                    path: req.path
                  },
                  {
                    js: { path: files.js.path, contents: '' },
                    css: files.css
                  },
                  ua
                ]
              })
              emit[seq] = (err, data) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(data)
                }
              }

              if (!ready) {
                console.log('Ssr not initialized wait ⏳')
                q.push(args + endIndicator)
              } else {
                child.stdin.write(args + endIndicator)
              }
            })

          // with silent: true, you can see and use stdout/stderr
          // new Function('require', code)(require)

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

    // need something for rnative as well...
    wss.broadcast({ type: 'reload' })
  }

  const serveSSR = async (req, res) => {
    if (initial) {
      try {
        const userAgent = req.headers['user-agent'] || ''
        const r = await ssr(req, files, ua(userAgent))
        if (typeof r === 'object') {
          if (r.statusCode) {
            res.statusCode = r.statusCode
          }
          res.end(
            (r.response && r.response).replace(
              '</html>',
              '<script src="/livereload.js"></script></html>'
            )
          )
        } else {
          res.end(
            r.replace(
              '</html>',
              '<script src="/livereload.js"></script></html>'
            )
          )
        }
      } catch (err) {
        lastServer = void 0
        reportServerError(err, false, false, ssrCode)
        const r = await defaultServer(req, files, ssr)
        res.end(
          r.replace('</html>', '<script src="/livereload.js"></script></html>')
        )
      }
    } else {
      reportServerError({ notReady: true, message: 'Compiling...' })
      const r = await defaultServer(req, files)
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
