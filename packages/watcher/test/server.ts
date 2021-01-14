const render = async opts => {
  console.log('Ok this is ssr', opts)
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

export default render
