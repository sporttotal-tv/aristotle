import { emptyDir, writeFile, writeJson } from 'fs-extra'
import { join, relative, basename } from 'path'
import build from '@sporttotal/aristotle-build'
import {
  hasServer,
  isPublicFile,
  BuildJson,
  BuildJsonFile,
} from '@sporttotal/aristotle-server-utils'
import getPkg from '@sporttotal/get-package'
import gzip from 'zlib'
import util from 'util'

const unzip = util.promisify(gzip.gunzip)

/*
    dist
        // adds deps that cant be compiled
        package.json
            start script starts index.js
        index.js // uses the start server from the pkg
        render // compiled server file
        files
            // also puts all server files in here (e.g. img)
            file
            
*/

// also add all extra options (need for watcher as well)
export default async ({
  target,
  dest,
  external,
}: {
  target: string
  dest: string
  external?: string[]
}) => {
  await emptyDir(dest)

  const serverPath = await hasServer(target)

  const browserBuild = await build({
    entryPoints: [target],
    minify: true,
    platform: 'browser',
    production: true,
    gzip: true,
    external,
  })

  const folderPkg = await getPkg(target)

  const pkg = {
    name: folderPkg.name,
    version: folderPkg.version,
    scripts: {
      start: 'node ./server/index.js',
    },
    dependencies: {
      '@sporttotal/aristotle-server': '^1.0.1',
    },
  }

  const q = []

  const path = join(dest, 'server')
  await emptyDir(path)

  if (serverPath) {
    const serverBuild = await build({
      entryPoints: [serverPath],
      platform: 'node',
      minify: true,
      production: true,
      gzip: true,
      external,
    })
    for (const key in serverBuild.files) {
      const file = serverBuild.files[key]
      if (isPublicFile(file)) {
        browserBuild.files[key] = file
      }
    }

    for (const key in serverBuild.dependencies) {
      browserBuild.dependencies[key] = serverBuild.dependencies[key]
    }

    q.push(
      writeFile(
        join(path, 'server.js'),
        await unzip(serverBuild.js[0].contents)
      )
    )

    const serverFile = `
      const renderer = require('./server.js')
      const { join } = require('path')
      const startServer = require('@sporttotal/aristotle-server').default
      startServer({ 
        port: process.env.PORT ? Number(process.env.PORT) : 443, 
        renderer: renderer.default, 
        cacheFunction: renderer.cache, 
        buildJson: join(__dirname, '../build.json')  
      })
    `

    q.push(writeFile(join(path, 'index.js'), serverFile))
  } else {
    const serverFile = `
    const startServer = require('@sporttotal/aristotle-server').default
    const { join } = require('path')
    startServer({ 
      port: process.env.PORT ? Number(process.env.PORT) : 443, 
      buildJson: join(__dirname, '../build.json')  
    })
   `
    q.push(writeFile(join(path, 'index.js'), serverFile))
  }

  await emptyDir(join(dest, 'files'))

  for (const key in browserBuild.dependencies) {
    pkg.dependencies[key] = browserBuild.dependencies[key]
  }

  q.push(
    writeJson(join(dest, 'package.json'), pkg, {
      spaces: 2,
    })
  )

  for (const key in browserBuild.files) {
    const file = browserBuild.files[key]
    const name = key.slice(1)
    const path = join(dest, 'files', file.gzip ? name + '.gz' : name)
    q.push(writeFile(path, file.contents))
  }

  await Promise.all(q)

  const buildPath = join(dest, 'build.json')

  const files: { [key: string]: BuildJsonFile } = {}

  for (const key in browserBuild.files) {
    const file = browserBuild.files[key]
    files[key] = {
      gzip: file.gzip,
      url: file.url,
      checksum: file.checksum,
      path: basename(file.path),
      mime: file.mime,
      contents: file.gzip ? join('./files', key + '.gz') : join('./files', key),
    }
  }

  const buildJson: BuildJson = {
    js: browserBuild.js.map((v) => v.url),
    css: browserBuild.css.map((v) => v.url),
    files,
    dependencies: browserBuild.dependencies,
    env: browserBuild.env,
    entryPoints: browserBuild.entryPoints.map((v) =>
      relative(process.cwd(), v)
    ),
  }

  q.push(writeJson(buildPath, buildJson))
}
