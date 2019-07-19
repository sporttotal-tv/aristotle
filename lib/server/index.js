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
const { forkString } = require('child-process-fork-string')

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

  const update = (clientFiles, server, error) => {
    console.log('')
    const addres = `http://${ip.address()}:${port}`
    console.log(chalk.magenta(`🛸  Dev server listening on ${addres}`))
    console.log('')

    let child = false

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
      // not with return but over the stdout
      //

      //  process.stdout.write('end');

      // need process stdin

      const code = (ssrCode =
        server.code +
        `
          // std in from the server
          // std out back to it


        process.stdin.setEncoding('utf8');

        process.stdin.on('readable', () => {
          let chunk
          let data = ''
          // Use a loop to make sure we read all available data.
          while ((chunk = process.stdin.read()) !== null) {
            data+=chunk
          }
          process.stdout.write(data);
          process.stdout.write(${server.id}(data));
        });
        
        process.stdin.on('end', () => {
          process.stdout.write('end');
        });


          console.log('penis');

          // return ${server.id};
        `)

      if (lastServer !== server.codeHash) {
        // eslint-disable-next-line
        if (!lastServer) {
          console.log(
            chalk.magenta(`🛸️  SSR function from file ${server.path}`)
          )
        }
        try {
          // eslint-disable-next-line
          // console.log(code)

          const options = {
            silent: true
          }

          if (child) {
            console.log('KILL PREV FORK')
          }

          child = forkString(code, options)

          child.stdout.on('data', data => {
            console.log(`stdout: ${data}`)
          })

          child.stderr.on('data', data => {
            console.log(`stderr: ${data}`)
          })

          child.stdin.write(
            JSON.stringify({
              url: '/',
              seq: ++seqId
            })
          )

          // You can send a callback if you want, and it's simple !
          child.on('close', code => {
            if (code === 0) {
              console.log('No err')
            } else {
              console.log('Err !')
            }
          })

          ssr = () => {
            console.log('lullz')
            // child.send('flapflap')
            return 'lullz'
          }

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
