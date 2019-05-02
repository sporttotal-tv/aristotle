import ReactDOMServer from 'react-dom/server'
import React from 'react'
import App from './App'

// ${ReactDOMServer.renderToString(<App />)}
// console.log('yes', ReactDOMServer)
// ReactDOMServer.renderToString(<App />)

export default async (req, files) => {
  const app = ReactDOMServer.renderToString(<App />)
  console.log('INCOMING SSR', req.url)
  return `
    <!DOCTYPE html>
    <html>
      <style>
        html, body {
          height: 100%;
          width: 100%;
        }
      </style>
      <meta charset="UTF-8">
      <head>
        <style>
          ${files.css.contents}
          ${global.aristotle.css}
        </style>
      </head>
      <body>
        ${app}
        <script src="/flapflap${files.js.path}"></script>
      </body>
    </html>
  `
}
