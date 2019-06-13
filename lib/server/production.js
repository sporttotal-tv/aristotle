const http = require('http')
const zlib = require('mz/zlib')
const fs = require('mz/fs')
const chalk = require('chalk')
const mime = require('mime-types')
const hash = require('string-hash')
const klaw = require('klaw')
const { join } = require('path')
const useES5 = require('./useES5')
const ua = require('vigour-ua')

// allways one minute?
const cacheTime = 30

// unsafe to use
const minify = str => {
  if (typeof str === 'string' && str.indexOf('<html') !== -1) {
    str = str.replace(/\n/g, '')
    str = str.replace(/[\t ]+</g, '<')
    str = str.replace(/>[\t ]+</g, '><')
    str = str.replace(/>[\t ]+$/g, '>')
    str = str.replace(/\s{1, 30}+/g, ' ')
    str = str.replace(/\t{1, 30}+/g, ' ')
  }
  return str
}

const serve = (file, res, error) => {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-length', file.length)
  res.setHeader('content-type', file.mime)
  if (error) {
    res.statusCode = error
    res.setHeader('cache-control', file.cache)
    if (file.hahs) {
      res.setHeader('ETag', file.hash)
    }
  } else {
    res.setHeader('cache-control', file.cache)
    res.setHeader('ETag', file.hash)
  }
  res.end(file.file)
}

const createFile = async (file, val, cache, checksum) => {
  const filePath = typeof file === 'string' ? file.split('?')[0] : file

  console.log(file, cache)

  const mimeType = /\.es5$/.test(filePath)
    ? 'application/javascript'
    : /\..{1,50}$/.test(filePath)
    ? mime.lookup(filePath)
    : 'text/html'

  const gz = await zlib.gzipSync(val)
  return {
    file: gz,
    length: Buffer.byteLength(gz),
    mime: mimeType,
    hash: checksum || hash(val.toString()),
    cache:
      cache || mimeType === 'text/html' || file === '/sw.js'
        ? 'max-age=' + cacheTime // 3 sec is very short but this is for testing
        : 'max-age=31536000, immutable'
  }
}

const readFolder = () =>
  new Promise((resolve, reject) => {
    const items = [] // files, directories, symlinks, etc
    const dir = join(__dirname, '../')
    klaw(dir)
      .on('data', item => {
        const f = item.path
        if (
          /\.[a-z0-9]{1,5}/.test(f) &&
          !/server/i.test(f) &&
          f[0] !== '.' &&
          f !== 'files.json' &&
          f !== 'package.json' &&
          !/node_modules/i.test(f)
        ) {
          items.push({
            key: item.path.replace(dir, ''),
            val: fs.readFileSync(item.path)
          })
        }
      })
      .on('end', () => resolve(items))
  })

const createMap = async () => {
  const fileMap = {}
  const files = await readFolder()
  for (let { key, val } of files) {
    fileMap['/' + key] = await createFile(key, val)
    if (key === '/static/robots.txt' || key === '/public/robots.txt') {
      fileMap['/robots.txt'] = fileMap['/' + key]
    }
  }
  if (!fileMap['/robots.txt']) {
    fileMap['/robots.txt'] = await createFile(
      'robots.txt',
      Buffer.from(
        `User-agent: * 
Disallow:`,
        'utf8'
      ),
      'max-age=' + cacheTime
    )
  }
  return fileMap
}

const isFilePath = /.{1,100}\/.{1,100}\..{1,30}$/

const initServer = async port => {
  const ssr = require('./server')
  const files = await createMap()
  const result = require('./files.json')

  if (result.js) {
    files['/bundle.js'] = files[result.js.path]
  }
  if (result.css) {
    files['/bundle.css'] = files[result.css.path]
  }

  let ssrCache = {}
  // clear SSR Cache every cacheTime
  setInterval(() => {
    ssrCache = {}
  }, 1e3 * cacheTime)
  http
    .createServer(async (req, res) => {
      // some ddos / wrong formatted reqs protection here
      if (req.method === 'POST') {
        if (req.url === '/clear-ssr-cache') {
          ssrCache = {}
        }
        res.end('')
      } else {
        let url = req.url
        let file = files[url]
        if (!file && isFilePath.test(req.url)) {
          const fileName = req.url.split('/')
          const parsedUrl = '/' + fileName[fileName.length - 1]
          file = files[parsedUrl]
          if (file) {
            url = parsedUrl
          }
        }
        if (file) {
          if (file.mime === 'application/javascript') {
            const isEs5 = useES5(req)
            if (isEs5) {
              file = files[url + '.es5'] || file
            }
          }
          serve(file, res)
        } else {
          try {
            // ua
            const userAgent = req.headers['user-agent']
            // needs an optmized version of ua parser
            const parsedUa = ua(userAgent || '')
            const device = userAgent ? JSON.stringify(parsedUa) : ''
            const id = req.url + device
            // can cache and gzip common response (including ua)
            const fromCache = ssrCache[id]
            if (fromCache) {
              serve(fromCache, res)
            } else {
              // const r = await ssr(req, result, parsedUa)
              const ssrResponse = await ssr(req, result, parsedUa)

              if (typeof ssrResponse === 'object') {
                const isError = ssrResponse.statusCode
                  ? ssrResponse.statusCode === 404 ||
                    ssrResponse.statusCode === 503
                  : false
                const obj = (ssrCache[id] = await createFile(
                  req.url,
                  minify(ssrResponse.response),
                  ssrResponse.cache || 'max-age=' + (isError ? 0 : cacheTime),
                  ssrResponse.checksum
                ))
                serve(obj, res, isError ? ssrResponse.statusCode : false)
              } else {
                const r = minify(ssrResponse)
                const obj = (ssrCache[id] = await createFile(
                  req.url,
                  r,
                  'max-age=' + cacheTime
                ))
                // add cleaner for this
                serve(obj, res)
              }
            }
          } catch (err) {
            res.statusCode = 503
            res.end()
          }
        }
      }
    })
    .listen(port)
  console.log(
    chalk.blue(
      `🛸  Start production server on port "${port}" maxCache ${cacheTime} seconds`
    )
  )
}

// default should be https...
const port = process.argv[3] || 8082

initServer(port)
