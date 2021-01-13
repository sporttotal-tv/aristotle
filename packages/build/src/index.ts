import build from './build'
import watch from './watch'

/*
options:

{
    browser: true, // default true

}
*/

export type File = {
  checksum: string
  path: string
  contents: Buffer
  compressed: boolean
  gzip: boolean
  text: string
  mime: string
  url: string
}

export type BuildResult = {
  env: string[]
  js: File[]
  css: File[]
  files: {
    [filename: string]: File
  }
  errors: string[]
  dependencies: {
    [pkg: string]: string
  }
}

export type BuildOpts = {
  entryPoints: string[]
  external?: string[]
  minify?: boolean
  platform?: 'node' | 'browser'
  sourcemap?: boolean
  cssReset?: boolean
}

export type WatchCb = (result: BuildResult) => void

export default (opts: BuildOpts, watchCb?: WatchCb) =>
  watchCb ? watch(opts, watchCb) : build(opts)
/*
{
    errors: [{
        path,
        text, (file)
        message,
        line,
        column
    }],
    env: ['FLURP', 'NODE_ENV'] // js file! 
    server: { main: key, sourcemaps: [key] },
    scripts: [key], // make this not key but reference!
    styles: [key], // same here
    files: {
        '/gaghsag.js': {
            contents: (gzipped on prod),
            gzip: false,
            compressed: false,
            minified: false,
            path: '../', // original file path
            text: '',
            mime: 'application/javascript,
            url: '/gaghsag.js', // this is nice for mapping
            checksum: (key)
        },
    }
}
*/

/*
const render = ({ scripts, styles, head, body }, req) => {
    return `<html>
        <head>
            ${head}
            ${styles.map(({ text }) => `<style>${text}</style>`).join('')}
        </head>
        <body>
            ${body}
            ${scripts.map(({ url }) => `<script type='application/javascript' src="${url}"" />`).join('')}
        </body>
    </html>`
}

// OR (which I like)

const render = ({ head, body, files, scripts, styles, env, envFile }, req) => {
    return `<html>
        <head>${head}</head>
        <body>${body}</body>
    </html>`
}

// errors only get handled by the dev server
const render = ({ head, body, files, scripts, styles, env, envFile }, req) => {
    return {
        cache: 1e3,
        code?: 503, 400 easy
        mime?: 'html/text',
        contents: Buffer || string
        contentLength?: 500,
        gzip?: false
    }
}

// if there are errors the render does not get called, we just render a custom error page

// so why not add livereload to it? => watcher could add it to the result
*/
