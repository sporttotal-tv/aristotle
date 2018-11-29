import ReactDOMServer from 'react-dom/server'
import React from 'react'
import App from './App'
import hub from './hub'

// ${ReactDOMServer.renderToString(<App />)}

console.log('yes', ReactDOMServer)

export default async (req, files) => {
  hub.set('device.history', req.url)
  console.log('INCOMING SSR', req.url)
  return `
    <!DOCTYPE html>
    <html>
      <meta charset="UTF-8">
      <head>
        <style>
          ${files.css.contents}
        </style>
      </head>
      <body>
        ${ReactDOMServer.renderToString(<App />)}
        <script src="${files.js.path}"></script>
      </body>
    </html>
  `
}
