import React from 'react'
import './react-native.css'
import parseProps from './props'

const TouchableOpacity = props => {
  const p = parseProps(props, 'v')
  if (props.onPress) {
    p.onClick = props.onPress
  }
  return React.createElement('a', p, props.children)
}

export default TouchableOpacity
