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
        SERVER TIME
      </body>
    </html>
  `
}
