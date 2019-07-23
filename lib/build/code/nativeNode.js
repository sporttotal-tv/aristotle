const parseJson = props => {
  if (!props.bundle.nativeNode) {
    props.bundle.nativeNode = []
  }
  props.bundle.nativeNode.push(props.file)
}

module.exports = parseJson
