import { basename, extname } from 'path'
import mime from 'mime-types'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import fbFixes from 'postcss-flexbugs-fixes'
import unit from 'postcss-default-unit'

const replacer = g => `-${g[0].toLowerCase()}`
const toKebabCase = str => str.replace(/([A-Z])/g, replacer)

const reducer = (obj, file) => {
  const path = basename(file.path)
  const ext = extname(file.path)
  const url = `/${path}`

  if (ext === '.js') {
    obj.js.push(file)
    file.text
      .match(/process\.env\.[a-zA-Z0-9_]+/g)
      .forEach(obj.env.add, obj.env)
  } else if (ext === '.css') {
    obj.css.push(file)
  }

  const hashUrl = url

  obj.files[hashUrl] = file
  file.url = hashUrl
  file.checksum = 123
  file.mime = mime.lookup(path) || 'application/octet-stream'

  return obj
}
const STYLES_PATH = '/generated-styles.css'
const parseBuild = async (result, styles, dependencies) => {
  const parsed = {
    // line and file
    errors: result.errors || result instanceof Error ? [result] : [],
    css: [],
    js: [],
    files: {},
    env: new Set(),
    dependencies
  }

  if (styles) {
    if (!styles.cache) {
      let str = ''
      for (const prop in styles.css) {
        for (const val in styles.css[prop]) {
          const className = styles.css[prop][val]
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

      // styles.cache = str
      styles.cache = (
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

    result.outputFiles.push({
      path: STYLES_PATH,
      text: styles.cache,
      contents: styles.cache
    })
  }

  return result.outputFiles
    ? result.outputFiles.reduce(reducer, parsed)
    : parsed
}

export default parseBuild
