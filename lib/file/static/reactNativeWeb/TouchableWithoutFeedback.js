import React from 'react'
import './react-native.css'
import parseProps from './props'

const TouchableWithoutFeedback = props => {
  const p = parseProps(props, 'v')
  if (props.onPress) {
    p.onClick = props.onPress
  }
  return React.createElement('a', p, props.children)
}

export default TouchableWithoutFeedback
