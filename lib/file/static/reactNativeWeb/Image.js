import React from 'react'
import './react-native.css'
import parseProps from './props'

const Image = props => {
  const p = parseProps(props, 'i')
  if (props.source) {
    if (!p.style) {
      p.style = {}
    }
    p.style.backgroundImage = 'url(' + props.source.uri + ')'
    if (props.resizeMode) {
      p.style.backgroundSize = props.resizeMode
    }
  }
  return React.createElement('div', p)
}

export default Image
