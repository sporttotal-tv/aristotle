const parseJson = props => {
  const { file, bundle, type: bundleType } = props
  const parsedFile = file[bundleType].parsed

  if (parsedFile) {
    bundle.js.unshift(parsedFile.code)
    if (bundle.jsEs2015) {
      bundle.jsEs2015.unshift(parsedFile.code)
    }
  }
}

module.exports = parseJson
