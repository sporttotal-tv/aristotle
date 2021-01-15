import { emptyDir } from 'fs-extra'
import build from '@saulx/aristotle-build'
import { hasServer } from '@saulx/aristotle-server-utils'
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

  console.log(browserBuild)

  if (serverPath) {
    const serverBuild = await build({
      entryPoints: [serverPath],
      platform: 'node',
      minify: true,
      production: true,
      gzip: true
    })

    console.log(serverBuild)
  } else {
    // add the default renderer (can also do this in the actual server)
  }

  // put good defaults
  // add 2 entrypoints

  // build build

  // then call build
}
