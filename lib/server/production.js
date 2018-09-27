const http = require('http')
const zlib = require('mz/zlib')
const fs = require('mz/fs')
const chalk = require('chalk')
const mime = require('mime-types')
const hash = require('string-hash')
const klaw = require('klaw')
const { join } = require('path')

const serve = (val, res) => {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('content-encoding', 'gzip')
  res.setHeader('content-length', val.length)
  res.setHeader('content-type', val.mime)
  res.setHeader('cache-control', val.cache)
  res.setHeader('ETag', val.hash)
  res.end(val.file)
}

const createFile = async (file, val, cache, mimeType = mime.lookup(file)) => {
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
          /\.[a-z]{1,5}$/.test(f) &&
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
  }
  return fileMap
}

const initServer = async () => {
  const ssr = require('./server')
  const files = await createMap()
  const result = require('./files.json')
  const ssrCache = {}
  http
    .createServer(async (req, res) => {
      // some ddos / wrong formatted reqs protection here
      const file = files[req.url]
      if (file) {
        serve(file, res)
      } else {
        try {
          // can cache and gzip common response (including ua)
          const fromCache = ssrCache[req.url]
          if (fromCache) {
            serve(fromCache, res)
          } else {
            const r = await ssr(req, result)
            const obj = (ssrCache[req.url] = await createFile(
              req.url,
              r,
              'max-age=3'
            ))
            serve(obj, res)
          }
        } catch (err) {
          res.statusCode = 404
          res.end()
        }
      }
    })
    .listen(port)
  console.log(chalk.blue(`🛸  Start production server on port "${port}"`))
}

// default should be https...
const port = process.argv[3] || 8082
initServer(port)
