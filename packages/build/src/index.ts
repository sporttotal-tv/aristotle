import build from './build'
import watch from './watch'

/*
options:

{
    browser: true, // default true

}
*/

export default opts => (opts.watch ? watch(opts) : build(opts))
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

const render = ({ head, body }, req) => {
    return `<html>
        <head>
            ${head}
        </head>
        <body>
            ${body}
        </body>
    </html>`
}

// if there are errors the render does not get called, we just render a custom error page

// so why not add livereload to it? => watcher could add it to the result
*/
