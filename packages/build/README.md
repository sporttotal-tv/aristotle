# build

Build for production

```ts
import build from 'ops-build'

const result = await build({
  entryPoints: ['index.js'],
  minify: true,
  outdir: 'dist'
})
```

Dev builds

```ts
import build from 'ops-build'

const result = await build({
  entryPoints: ['index.js'],
  sourcemap: true
})
```

Dev Server Example

```ts
import build from 'ops-build'

const buildOpts = {
  entryPoints: ['index.js'],
  sourcemap: true,
  watch: true
}

const render = ({ styles, scripts, files }) =>
  `<html>
    <head>
        ${styles.map(({ text }) => `<style>${text}</style>`).join('')}
    </head>
    <body>
        <div id="root"></div>
        ${scripts.map(({ url }) => `<script src="${url}"></script>`).join('')}
    </body>
</html>`

http.createServer(async (req, res) => {
  const result = await build(buildOpts)
  const { styles, scripts, files } = result
  if (!req.url || req.url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(render(result))
  } else if (req.url in files) {
    res.writeHead(200, { 'content-type': files[req.url].type })
    res.end(Buffer.from(files[req.url].contents))
  } else {
    res.writeHead(404)
    res.end()
  }
})
```
