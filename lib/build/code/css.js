const parseCss = props => {
  const { file, bundle, type: bundleType } = props
  const parsedFile = file[bundleType].parsed
  bundle.cssChunks.push(parsedFile.css)
  if (!bundle.cssFiles) {
    bundle.cssFiles = []
  }
  bundle.cssFiles.push({ css: parsedFile.css, file })
  bundle.js.unshift(parsedFile.code)
}

module.exports = parseCss
