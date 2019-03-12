import ReactDOMServer from 'react-dom/server'
import React from 'react'
import App from './App'
import hub from './hub'

// ${ReactDOMServer.renderToString(<App />)}

// console.log('yes', ReactDOMServer)

ReactDOMServer.renderToString(<App />)

export default async (req, files) => {
  hub.set('device.history', req.url)
  const app = ReactDOMServer.renderToString(<App />)
  console.log('INCOMING SSR', req.url)
  return `
    <!DOCTYPE html>
    <html>
      <meta charset="UTF-8">
      <head>
        <style>
          ${files.css.contents}
          ${global.aristotle.css}
        </style>
      </head>
      <body>
        ${app}
        <script src="${files.js.path}"></script>
      </body>
    </html>
  `
}
