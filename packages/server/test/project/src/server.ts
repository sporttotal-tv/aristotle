import img from './large.jpg'
import img2 from './nasa.jpg'
// import App from './App'
// need to parse req at the top!

export const cache = req => {
  return req.url.pathname
}

let cnt = 0

setInterval(() => {
  cnt++
}, 1e3)

const render = async opts => {
  if (opts.url.pathname === '/no') {
    // this kill sthe connectionxxxx
    return null
  }

  return {
    contents: `<html>
    <head>
      <meta charset="UTF-8" />
      ${opts.head}
    </head>
    <body>
      YESH  for  mxxyexxxxxxxxxxxxsh!
      ${opts.body} CACHE COUNT ${cnt}
      <img src="${img}" />
      <img src="${img2}" />
    </body>
  </html>`,
    memcache: 1
  }
}

export default render

setTimeout(() => {
  // console.log(lfapper.drol)
}, 1e3)

// import x

// blurf
