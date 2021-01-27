const { readFile, readdir, writeFile } = require('fs').promises
const { join } = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const PACKAGES = 'packages'

readdir(PACKAGES).then(async (files) => {
  const updated = {}
  const pkgs = await Promise.all(
    files.map(async (f) => {
      const pkgDir = join(__dirname, PACKAGES, f)
      const pkgPath = join(pkgDir, 'package.json')
      const pkgText = await readFile(pkgPath)

      const pkg = JSON.parse(pkgText)
      const { stdout } = await execAsync('npm v --json', { cwd: pkgDir })
      const npmVersion = JSON.parse(stdout).version

      if (npmVersion !== pkg.version) {
        updated[pkg.name] = pkg
      }

      return { pkg, pkgPath, npmVersion }
    })
  )

  let done
  while (!done) {
    done = true
    for (const p of pkgs) {
      const { pkg, pkgPath, bumpedVersion, npmVersion } = p
      if (pkg.dependencies) {
        for (const depName in pkg.dependencies) {
          if (depName in updated) {
            const depVersion = pkg.dependencies[depName]
            const newVersion = `^${updated[depName].version}`
            if (newVersion !== depVersion) {
              console.info(`Updating: ${pkgPath}:`)
              console.info(`- ${depName} from ${depVersion} to ${newVersion}`)
              if (!bumpedVersion) {
                if (pkg.version === npmVersion) {
                  const split = pkg.version.split('.')
                  split[split.length - 1] = Number(split[split.length - 1]) + 1
                  const bumpedVersion = split.join('.')
                  console.info(
                    `- version from ${pkg.version} to ${bumpedVersion}`
                  )
                  pkg.version = bumpedVersion
                }
                p.bumpedVersion = true
              }
              pkg.dependencies[depName] = newVersion
              updated[pkg.name] = pkg
              done = false
            }
          }
        }
      }
    }
  }

  return Promise.all(
    pkgs.map(({ pkg, pkgPath, bumpedVersion }) => {
      if (bumpedVersion) {
        console.info('write package:', pkgPath)
        return writeFile(pkgPath, JSON.stringify(pkg, null, 2))
      }
    })
  )
})
