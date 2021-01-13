const render = async opts => {
  console.log('hello')
  console.log('ok', opts, 'shit')
  return `<html>
    <head>
      <meta charset="UTF-8" />
      ${opts.head}
    </head>
    <body>
      YESH SPECIALsx???!
      ${opts.body}
    </body>
  </html>`
}

console.log('???????????')

export default render
