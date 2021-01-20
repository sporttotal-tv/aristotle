import { basename, join } from 'path'
import mime from 'mime-types'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import fbFixes from 'postcss-flexbugs-fixes'
import unit from 'postcss-default-unit'
// import { murmurHash } from 'murmurhash-native'
import { hash } from '@saulx/utils'
import zlib from 'zlib'
import { promisify } from 'util'
import fs from 'fs'
import { BuildOpts } from './'
import { File, BuildResult } from '@saulx/aristotle-types'

const STYLES_PATH = '/generated-styles.css'
const RESET_PATH = '/reset-styles.css'
const gzip = promisify(zlib.gzip)

const replacer = g => {
  return `-${g[0].toLowerCase()}`
}

const toKebabCase = str => {
  return str.replace(/([A-Z])/g, replacer)
}

const parseFile = (parsed: BuildResult, file, envs) => {
  file.contents = Buffer.from(file.contents)

  const path = basename(file.path)
  const split = path.split('.')
  const name = split[0]
  const ext = split[split.length - 1]
  const t = file.text
  const h = hash(t)

  let url
  if (ext === 'js') {
    parsed.js.push(file)
    const m = t.match(/process\.env\.([a-zA-Z0-9_])+/g)
    if (m) {
      m.forEach(envs.add, envs)
    }
    url = `/${name}.${h}.${ext}`
  } else if (ext === 'css') {
    parsed.css.push(file)
    url = `/${name}.${h}.${ext}`
  } else {
    url = `/${path}`
  }

  parsed.files[url] = file
  file.url = url
  file.checksum = h
  file.mime = mime.lookup(path) || 'application/octet-stream'
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

const parseStyles = async meta => {
  let str = ''
  for (const prop in meta.css) {
    for (const val in meta.css[prop]) {
      const className = meta.css[prop][val]
      if (typeof className === 'object') {
        if (prop === '@keyframes') {
          console.warn('ignoring keyframes, TODO')
          // console.log(prop, meta.css[prop])
        } else if (prop[0] === '@') {
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

const parseBuild = async (
  opts: BuildOpts,
  result,
  meta
): Promise<BuildResult> => {
  const parsed = {
    errors: result.errors || meta.errors || [],
    css: [],
    js: [],
    files: {},
    env: [],
    dependencies: meta.dependencies,
    entryPoints: opts.entryPoints
  }

  if (result.errors) {
    return parsed
  }

  if (!meta.cssCache) {
    meta.cssCache = await parseStyles(meta)
  }

  if (meta.cssCache) {
    result.outputFiles.push({
      path: STYLES_PATH,
      text: meta.cssCache,
      contents: Buffer.from(meta.cssCache)
    })
  }

  if (opts.cssReset !== false) {
    result.outputFiles.push(await getCssReset())
  }

  const envs = new Set()
  for (const file of result.outputFiles) {
    parseFile(parsed, file, envs)
  }

  envs.forEach((env: string, i) => {
    parsed.env.push(env.substring(12))
  })

  if (opts.gzip) {
    await Promise.all(
      Object.values(parsed.files).map(async (file: File) => {
        if (!file.gzip) {
          file.contents = await gzip(file.contents)
          file.gzip = true
        }
      })
    )
  }

  return parsed
}

export default parseBuild
