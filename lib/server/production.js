const http = require('http')
const zlib = require('mz/zlib')
const fs = require('mz/fs')
const chalk = require('chalk')
const mime = require('mime-types')
const hash = require('string-hash')
const klaw = require('klaw')
const { join } = require('path')
const useES5 = require('./useES5')

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

const serve = (file, res) => {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-length', file.length)
  res.setHeader('content-type', file.mime)
  res.setHeader('cache-control', file.cache)
  res.setHeader('ETag', file.hash)
  res.end(file.file)
}

const createFile = async (
  file,
  val,
  cache,
  mimeType = /\.es5$/.test(file) ? 'application/javascript' : mime.lookup(file)
) => {
  const gz = await zlib.gzipSync(val)
  return {
    file: gz,
    length: Buffer.byteLength(gz),
    mime: mimeType,
    hash: hash(val.toString()),
    cache:
      cache || mimeType === 'text/html' || file === '/sw.js'
        ? 'max-age=3' // 3 sec is very short but this is for testing
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
      'max-age=3600'
    )
  }
  return fileMap
}

const initServer = async () => {
  const ssr = require('./server')
  const files = await createMap()
  const result = require('./files.json')
  let ssrCache = {}
  // clear SSR Cache every hour
  setInterval(() => {
    ssrCache = {}
  }, 1e3 * 60 * 60)
  http
    .createServer(async (req, res) => {
      // some ddos / wrong formatted reqs protection here
      if (req.method === 'POST') {
        if (req.url === '/clear-ssr-cache') {
          ssrCache = {}
        }
        res.end('')
      } else {
        let file = files[req.url]
        if (file) {
          if (file.mime === 'application/javascript') {
            const isEs5 = useES5(req)
            if (isEs5) {
              file = files[req.url + '.es5'] || file
            }
          }
          serve(file, res)
        } else {
          try {
            // can cache and gzip common response (including ua)
            const fromCache = ssrCache[req.url]
            if (fromCache) {
              serve(fromCache, res)
            } else {
              const r = minify(await ssr(req, result))

              const obj = (ssrCache[req.url] = await createFile(
                req.url,
                r,
                'max-age=10'
              ))
              // add cleaner for this
              serve(obj, res)
            }
          } catch (err) {
            res.statusCode = 404
            res.end()
          }
        }
      }
    })
    .listen(port)
  console.log(chalk.blue(`🛸  Start production server on port "${port}"`))
}

// default should be https...
const port = process.argv[3] || 8082
initServer(port)
