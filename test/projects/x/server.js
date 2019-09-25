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
        <script src="${files.js.path + '.es5'}"></script>
      </body>
    </html>
  `
}
