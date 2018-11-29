const path = require('path')
const fs = require('mz/fs')

const browserResolve = async (pkg, p, pkgPath) => {
  const { browser, module, main } = pkg.node.parsed.js

  if (module) {
    const resolvedMain = path.join(pkgPath, main || 'index.js')
    if (p === resolvedMain) {
      p = path.join(pkgPath, module)
    }
  }

  if (browser) {
    let projectDir = pkg.path.split(path.sep).slice(0, -1)
    const fileDir = p.split(path.sep)
    const parsedFile = []
    fileDir.forEach((val, index) => {
      if (projectDir[index] !== val) {
        parsedFile.push(val)
      }
    })
    const fileName = './' + parsedFile.join('/')

    let resultParsed = false
    const indexRe = /\/index\.js$/

    if (typeof browser === 'string') {
      resultParsed = browser.replace(indexRe, '')
    } else {
      for (let key in browser) {
        const keyParsed = key.replace(indexRe, '')
        if (fileName.replace(indexRe, '') === keyParsed) {
          resultParsed = browser[key].replace(indexRe, '')
          break
        }
      }
    }

    if (resultParsed) {
      const result = projectDir.concat(
        resultParsed[0] === '.'
          ? resultParsed.split(path.sep).slice(1)
          : resultParsed.split(path.sep)
      )
      if (!/\.[a-z0-9]{1,10}$/.test(result[result.length - 1])) {
        result.push('index.js')
      }

      let filePath = result.join(path.sep)

      const exists = await fs.exists(filePath)
      if (!exists) {
        result.pop()
        result[result.length - 1] = result[result.length - 1] + '.js'
        filePath = result.join(path.sep)
      }

      return filePath
    }
  }

  return p
}

exports.browserResolve = browserResolve
