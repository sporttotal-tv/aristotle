import React from 'react'
import './react-native.css'
import parseProps from './props'

const Text = props => {
  const numberOfLines = props.numberOfLines
  const ellipsizeMode = props.ellipsizeMode
  const className =
    numberOfLines === 1 || ellipsizeMode === 'tail' ? 't _t' : 't'
  const p = parseProps(props, className)
  return React.createElement('span', p, props.children)
}

export default Text
