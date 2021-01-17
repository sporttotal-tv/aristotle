import { emptyDir, writeFile, writeJson } from 'fs-extra'
import { join } from 'path'
import build from '@saulx/aristotle-build'
import { hasServer, isPublicFile } from '@saulx/aristotle-server-utils'
import getPkg from '@saulx/get-package'
import gzip from 'zlib'
import util from 'util'

const unzip = util.promisify(gzip.unzip)

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
export default async ({ target, dest }: { target: string; dest: string }) => {
  await emptyDir(dest)

  const serverPath = await hasServer(target)

  const browserBuild = await build({
    entryPoints: [target],
    minify: true,
    platform: 'browser',
    production: true,
    gzip: true
  })

  const folderPkg = await getPkg(target)

  const pkg = {
    name: folderPkg.name,
    version: folderPkg.version,
    scripts: {
      start: 'node ./server.js'
    }
  }

  const q = []

  if (serverPath) {
    const serverBuild = await build({
      entryPoints: [serverPath],
      platform: 'node',
      minify: true,
      production: true,
      gzip: true
    })
    for (const key in serverBuild.files) {
      const file = serverBuild.files[key]
      if (isPublicFile(file)) {
        browserBuild.files[key] = file
      }
    }
    const path = join(dest, 'server')
    await emptyDir(path)
    q.push(
      writeFile(
        join(path, 'server.js'),
        await unzip(serverBuild.js[0].contents)
      )
    )
  } else {
    // add the default renderer (can also do this in the actual server)
    // make server index file
  }

  await emptyDir(join(dest, 'files'))

  q.push(
    writeJson(join(dest, 'package.json'), pkg, {
      spaces: 2
    })
  )

  for (const key in browserBuild.files) {
    const file = browserBuild.files[key]
    const name = key.slice(1)
    const path = join(dest, 'files', file.gzip ? name + '.gz' : name)
    q.push(writeFile(path, file.contents))
  }

  await Promise.all(q)

  const buildJson = {
    js: browserBuild.js.map(v => v.url),
    css: browserBuild.css.map(v => v.url),
    files: Object.keys(browserBuild.files),
    env: browserBuild.env,
    entryPoints: browserBuild.entryPoints,
    gzip: true
  }

  q.push(writeJson(join(dest, 'build.json'), buildJson))
  // also need to add all the meta info when reading those files
}
