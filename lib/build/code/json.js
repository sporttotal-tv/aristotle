const parseJson = props => {
  const { file, bundle, type: bundleType } = props
  const parsedFile = file[bundleType].parsed
  bundle.js.unshift(parsedFile.code)
}

module.exports = parseJson
