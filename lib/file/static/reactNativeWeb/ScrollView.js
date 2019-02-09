import React from 'react'
import './react-native.css'
import parseProps from './props'

const ScrollView = props => {
  const p = parseProps(props, 'v sv')
  return (
    <div
      style={{
        overflow: 'scroll',
        height: '100%',
        width: '100%',
        ...p.style
      }}
    >
      {props.children}
    </div>
  )
}

export default ScrollView
