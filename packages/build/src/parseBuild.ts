import { basename } from 'path'
import mime from 'mime-types'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import fbFixes from 'postcss-flexbugs-fixes'
import unit from 'postcss-default-unit'
import { hash } from '@saulx/utils'
import zlib from 'zlib'
import { join } from 'path'
import { promisify } from 'util'
import fs from 'fs'

const STYLES_PATH = '/generated-styles.css'
const RESET_PATH = '/reset-styles.css'
const gzip = promisify(zlib.gzip)

const replacer = g => {
  return `-${g[0].toLowerCase()}`
}

const toKebabCase = str => {
  return str.replace(/([A-Z])/g, replacer)
}

const reducer = (obj, file) => {
  file.contents = Buffer.from(file.contents)

  const path = basename(file.path)
  const [name, ext] = path.split('.')
  const h = hash(file.contents)
  let url
  if (ext === 'js') {
    obj.js.push(file)
    const m = file.text.match(/process\.env\.([a-zA-Z0-9_])+/g)
    if (m) {
      m.forEach(obj.env.add, obj.env)
    }
    url = `/${name}.${h}.${ext}`
  } else if (ext === 'css') {
    obj.css.push(file)
    url = `/${name}.${h}.${ext}`
  } else {
    url = `/${path}`
  }

  obj.files[url] = file
  file.url = url
  file.checksum = h
  file.mime = mime.lookup(path) || 'application/octet-stream'

  return obj
}

let cssReset

const parseCss = async str => {
  return (
    await postcss([
      unit({
        ignore: {
          'stop-opacity': true,
          'animation-name': true
        }
      }),
      fbFixes,
      autoprefixer({
        overrideBrowserslist: ['last 1 version', 'cover 95%', 'IE 10']
      }),
      cssnano
    ]).process(str, {
      from: STYLES_PATH,
      to: STYLES_PATH
    })
  ).css
}

const getCssReset = async () => {
  if (!cssReset) {
    const text = await parseCss(
      await fs.promises.readFile(join(__dirname, '../static/reset.css'))
    )
    cssReset = {
      path: RESET_PATH,
      text,
      contents: Buffer.from(text)
    }
  }
  return cssReset
}

const parseStyles = async files => {
  let str = ''
  for (const prop in files.css) {
    for (const val in files.css[prop]) {
      const className = files.css[prop][val]
      if (typeof className === 'object') {
        if (prop[0] === '@') {
          // it's a media query or something funky
          str += `${prop}{`
          for (const i in className) {
            str += `.${className[i]}{${toKebabCase(val)}:${i}}`
          }
          str += '}'
        } else {
          for (const i in className) {
            str += `.${className[i]}${prop}{${toKebabCase(val)}:${i}}`
          }
        }
      } else {
        str += `.${className}{${toKebabCase(prop)}:${val}}`
      }
    }
  }

  return parseCss(str)
}

const parseBuild = async (opts, result, files, dependencies) => {
  const parsed = {
    // line and file
    errors: result.errors || result instanceof Error ? [result] : [],
    css: [],
    js: [],
    files: {},
    env: new Set(),
    dependencies
  }

  if (files) {
    if (!files.cssCache) {
      files.cssCache = await parseStyles(files)
    }
    if (files.cssCache) {
      result.outputFiles.push({
        path: STYLES_PATH,
        text: files.cssCache,
        contents: Buffer.from(files.cssCache)
      })
    }
  }

  if (opts.cssReset !== false) {
    result.outputFiles.push(await getCssReset())
  }

  const r = result.outputFiles
    ? result.outputFiles.reduce(reducer, parsed)
    : parsed

  r.env = Array.from(r.env)
  r.env.forEach((env, i) => {
    r.env[i] = env.substring(12)
  })

  if (opts.gzip) {
    await Promise.all(
      Object.values(r.files).map(async file => {
        // @ts-ignore
        file.contents = await gzip(file.contents)
        // @ts-ignore
        file.gzip = true
      })
    )
  }

  return r
}

export default parseBuild
