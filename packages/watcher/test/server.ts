import img from './large.jpg'
import img2 from './nasa.jpg'
import App from './App'

console.log('?????', App)

const render = async opts => {
  console.log(
    'Ok this is ssr',
    opts.url.href,
    opts.url.pathname,
    opts.url.searchParams
  )

  // console.log(flapperlinus.x.drol)

  return `<html>
    <head>
      <meta charset="UTF-8" />
      ${opts.head}
    </head>
    <body>
      YESH SPExxxxxxxxxxxxELLO xwioeh myesh for you myesh!
      ${opts.body}
      <img src="${img}" />
      <img src="${img2}" />
    </body>
  </html>`
}

export default render
