import React from 'react'
import './react-native.css'
import parseProps from './props'

const ScrollView = props => {
  const p = parseProps(props, 'v sv')
  return (
    <div
      className={props.className || ''}
      style={{
        overflowY: 'scroll',
        overflowX: 'hidden',
        height: '100%',
        width: '100%',
        '-webkit-overflow-scrolling': 'touch',
        ...p.style
      }}
    >
      {props.children}
    </div>
  )
}

export default ScrollView
