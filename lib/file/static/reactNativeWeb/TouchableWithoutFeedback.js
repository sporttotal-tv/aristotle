import React from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

const TouchableWithoutFeedback = props => {
  const p = parseProps(props, 'v')
  if (props.onPress) {
    p.onClick = props.onPress
  }
  return React.createElement('a', p, props.children)
}

export default refWrapper(TouchableWithoutFeedback)
