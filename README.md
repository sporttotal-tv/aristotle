# Aristotle
Front end build tool to replace webpack without any configuration
- simple 
- opinionated 
- blazing fast 
- small build sizes 
- SSR 
- internationalization 
- code splitting
- static generation 
- inline styles 
- deployment
- react only
- speeds up react native web

### Usage

To install

`npm install -g aristotle`

To use for development

`aristotle index.js`

To use for building of a project, and adds the build project in a folder

`aristotle index.js some/dist/folder/`

### Server side rendering

To hook into aristotle for server side rendering or something else on your front end server create a `server` folder or `server.js` file.

Format the file to something like this
```js
export default async (req, files) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" /> 
      <style>${files.css.contents}</style>
    </head>
    <body>
      <div id="root"></div>
      <script src="${files.js.path}"></script>
    </body>
    </html>
  `
}
```

