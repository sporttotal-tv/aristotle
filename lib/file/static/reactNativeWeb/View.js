import React from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

const View = props => {
  const p = parseProps(props, 'v')
  return React.createElement('div', p, props.children)
}

export default refWrapper(View)
