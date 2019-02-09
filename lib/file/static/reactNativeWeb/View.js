import React from 'react'
import './react-native.css'
import parseProps from './props'

const View = props => {
  const p = parseProps(props, 'v')
  return React.createElement('div', p, props.children)
}

export default View
