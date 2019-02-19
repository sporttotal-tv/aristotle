import React from 'react'
import './react-native.css'
import parseProps from './props'

const ScrollView = props => {
  const p = parseProps(props, 'v')
  return (
    <div
      className={p.className || ''}
      style={{
        overflowY: 'scroll',
        overflowX: 'hidden',
        height: '100%',
        flexBasis: 0,
        width: '100%',
        maxHeight: '100%',
        minHeight: '100%',
        '-webkit-overflow-scrolling': 'touch',
        ...p.style
      }}
    >
      {props.children}
    </div>
  )
}

export default ScrollView
