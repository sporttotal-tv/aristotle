# serve

```js
// dev server
import serve from '@saulx/aristotle-serve'

serve({
  port: 8080,
  build: {
    entryPoints: ['index.tsx'],
    sourcemap: true,
    watch: true,
    loader: { '.js': 'jsx' },
    define: {
      'process.env.NODE_ENV': '"dev"'
    }
  }
})
```

```js
// production server
import serve from '@saulx/aristotle-serve'

serve({
  port: 8080,
  build: 'build.json' // build.json is default
})
```

```js
// generic server could be
import serve from '@saulx/aristotle-serve'

serve({
  port: 8080,
  build:
    process.env.NODE_ENV === 'production'
      ? 'build.json'
      : {
          entryPoints: ['index.tsx'],
          sourcemap: true,
          watch: true,
          loader: { '.js': 'jsx' },
          define: {
            'process.env.NODE_ENV': '"dev"'
          }
        }
})
```
