import img from './large.jpg'
import img2 from './nasa.jpg'
// import App from './App'
// need to parse req at the top!

export const cache = req => {
  console.info('doing me cache ??')
  return req.url.pathname
}

const render = async opts => {
  // console.log(xflap.x)
  if (opts.url.pathname === '/no') {
    // this kill sthe connectionxxxx
    return null
  }

  return `<html>
    <head>
      <meta charset="UTF-8" />
      ${opts.head}
    </head>
    <body>
      YESH  for  mxxyesh!
      ${opts.body}
      <img src="${img}" />
      <img src="${img2}" />
    </body>
  </html>`
}

export default render

setTimeout(() => {
  // console.log(lfapper.drol)
}, 1e3)

// import x

// blurf
