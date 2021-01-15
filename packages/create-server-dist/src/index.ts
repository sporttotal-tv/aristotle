import { emptyDir } from 'fs-extra'

console.log('this is a server!')

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
}
