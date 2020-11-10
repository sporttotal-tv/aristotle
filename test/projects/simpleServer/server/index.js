import ReactDOMServer from 'react-dom/server'
import React from 'react'
import App from '../App'

global.fetch('http://google.com').then(val => {
  console.log('yes from google!')
})

const getCacheKey = () => {
  console.log('poop time')
  return 'xxxx'
}

const render = async (req, files) => {
  return `
    <html>
      <meta charset="UTF-8">
      <head>
        <style>
          ${files.css.contents}
        </style>
      </head>
      <body>
        ssr!!!!!
        ${ReactDOMServer.renderToString(<App />)}
        <script src="${files.js.path}"></script>
      </body>
    </html>
  `
}

export default {
  getCacheKey,
  render
}
