// do stuff

// tmp folder

const parseNative = props => {
  if (!props.bundle.nativeNode) {
    props.bundle.nativeNode = []
  }
  props.bundle.nativeNode.push(props.file)
}

module.exports = parseNative
