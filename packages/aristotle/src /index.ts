import createServer from '@saulx/aristotle-create-server-dist'
import createWatcher from '@saulx/aristotle-watcher'
import { isAbsolute, join } from 'path'
import { program } from 'commander'
import getPkg from '@saulx/get-package'
import chalk, { keyword } from 'chalk'
import expandHomeDir from 'expand-home-dir'

// only option for now entry, dest, external, port (only for watcher)
type PkgOpts = {
  external?: string[]
}

const resolvePath = (path: string): string => {
  if (path[0] === '~') {
    path = expandHomeDir(path)
  } else if (!isAbsolute(path)) {
    path = join(process.cwd(), path)
  }
  return path
}

const readPkgConfig = async (target: string): Promise<PkgOpts | void> => {
  const pkg = await getPkg(target)
  if (pkg && pkg.aristotle) {
    return pkg.aristotle
  }
}

program
  .command('watch')
  .requiredOption('-t, --target <target>', 'Target to build')
  .option('-p, --port <port>', 'Port')
  .action(async cmd => {
    let { target, port } = cmd
    target = resolvePath(target)
    const config = await readPkgConfig(target)
    await createWatcher({
      target,
      port,
      external: config ? config.external : undefined
    })
  })

program
  .command('build')
  .requiredOption('-t, --target <target>', 'Target to build')
  .requiredOption('-d, --dest <dest>', 'Build Destination')
  .action(async cmd => {
    const d = Date.now()
    let { target, dest } = cmd
    target = resolvePath(target)
    dest = resolvePath(dest)
    const config = await readPkgConfig(target)

    console.info(chalk.blue('Building...'))

    await createServer({
      target,
      dest,
      external: config ? config.external : undefined
    })

    console.info(
      chalk.blue('✨ Build ready in'),
      Date.now() - d,
      chalk.blue('ms')
    )
  })

program.parse(process.argv)
