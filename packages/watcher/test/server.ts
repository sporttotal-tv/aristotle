const render = async opts => {
  return `<html>
    <head>
      <meta charset="UTF-8" />
      ${opts.head}
    </head>
    <body>
      YESH SPECIAL SERVER!
      ${opts.body}
    </body>
  </html>`
}

export default render
