import fs from 'fs'
import { join, dirname } from 'path'
import util from 'util'

const stat = util.promisify(fs.stat)

export default async (target: string): Promise<string | undefined> => {
  const files = ['server/index.ts', 'server/index.js', 'server.ts', 'server.js']
  for (const file of files) {
    const p = join(dirname(target), file)
    try {
      if (await stat(p)) {
        return p
      }
    } catch (err) {}
  }
}
