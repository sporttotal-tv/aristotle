const React = require('react')

const createRefWrapper = Component => {
  return React.forwardRef((props, ref) => {
    if (!ref) {
      return React.createElement(Component, props)
    } else {
      return React.createElement(
        Component,
        Object.assign({ forwardRef: ref }, props)
      )
    }
  })
}

export default createRefWrapper
