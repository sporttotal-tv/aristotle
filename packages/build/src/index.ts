import build from './build'
import watch from './watch'

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
    scripts: [key],
    styles: [key],
    files: {
        '/gaghsag.js': {
            contents: (gzipped on prod),
            gzip: false,
            compressed: false,
            minified: false,
            path: '../', // original file path
            text: '',
            mime: 'javascript,
            url: '/gaghsag.js', // this is nice for mapping
            checksum: (key)
        },
    }
}
*/

/*
const render = ({ scripts, styles }, req) => {
    return <html>
        <head>{styles.map(({ text }) => <style>{text}</style>)}</head>
        <body>{scripts.map(({ url }) => <script type='text/javascript' src={url} />}</body>
    </html>
}

// if there are errors the render does not get called, we just render a custom error page

// so why not add livereload to it? => watch could add it to the result
*/
