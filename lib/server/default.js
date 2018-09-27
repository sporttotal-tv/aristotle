// ssr
// default dev server script
module.exports = async (req, files) => {
  return `
    <html>
      <head>
        ${
          files.css && files.css.path
            ? `<link rel="stylesheet" type="text/css" href="${files.css.path.substring(
                1
              )}" />`
            : ''
        }
        <title>ARISTOTLE DEV SERVER</title>
      </head>
      <body>
        <script src="${files.js && files.js.path.substring(1)}"></script>
      </body>
    </html>
  `
}
