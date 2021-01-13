import http from 'http'

// production server
console.log('xyz')

const replaceVars = (_str, field) => `"${process.env[field] || ''}"`

export default opts => {
  const build =
    typeof opts.build === 'string'
      ? () => {
          // load the shit here
        }
      : require('@saulx/aristotle-build').default

  if (!opts.render) {
    opts.render = async ({ styles, scripts }) => {
      return `<html>
        <head>
            ${styles.map(({ text }) => `<style>${text}</style>`).join('')}
        </head>
        <body>
            <div id="root"></div>
            ${scripts
              .map(({ url }) => `<script src="${url}"></script>`)
              .join('')}
        </body>
    </html>`
    }
  }

  http
    .createServer(async (req, res) => {
      const result = await build(opts.build)
      const { files } = result
      if (req.url in files) {
        const { type } = files[req.url]
        res.setHeader('content-type', type)
        if (type === 'application/javascript') {
          const text = files[req.url].text.replace(
            /process\.env\.([a-zA-Z0-9_]+)/g,
            replaceVars
          )
          res.end(text)
        } else {
          const buffer = Buffer.from(files[req.url].contents)
          res.setHeader('content-length', Buffer.byteLength(buffer))
          res.end(buffer)
        }
      } else {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end(await opts.render(result))
      }
    })
    .listen(opts.port || process.env.PORT || 3000)
}
