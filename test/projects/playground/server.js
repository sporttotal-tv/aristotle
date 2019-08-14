global.fetch('http://google.com').then(val => {
  console.log('yes from google')
})

const timer = () =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, Math.random() * 300)
  })

export default async (req, files) => {
  await timer()

  return `
    <html>
      <meta charset="UTF-8">
      <head>
        <style>
          ${files.css.contents}
        </style>
      </head>
      <body>
      XXXXXXXXXXXXXXX
        ssr!!!!!
        <script src="${files.js.path}"></script>
      </body>
    </html>
  `
}
