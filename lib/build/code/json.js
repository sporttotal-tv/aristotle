const parseJson = props => {
  const { file, bundle, type: bundleType } = props
  const parsedFile = file[bundleType].parsed

  if (parsedFile) {
    bundle.js.unshift(parsedFile.code)
  }
}

module.exports = parseJson
