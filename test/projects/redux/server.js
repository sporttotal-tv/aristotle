// import bla from './'
// console.log(bla)

export default async (req, files) => {
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
        <script src="./${files.js.path}"></script>
      </body>
    </html>
  `
}
