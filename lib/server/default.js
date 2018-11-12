// ssr
// default dev server script
module.exports = async (req, files) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset=utf-8>
    <meta http-equiv=X-UA-Compatible content="IE=edge">
    ${
      files.css && files.css.path
        ? `<link rel="stylesheet" type="text/css" href="${files.css.path.substring(
            1
          )}" />`
        : ''
    }
  </head>
  <body>
    <script src="${files.js && files.js.path.substring(1)}"></script>
  </body>
</html>`
}
