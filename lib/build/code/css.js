const parseCss = props => {
  const { file, bundle, type: bundleType } = props
  const parsedFile = file[bundleType].parsed
  bundle.cssChunks.push(parsedFile.css)
  bundle.js.unshift(parsedFile.code)
}

module.exports = parseCss
