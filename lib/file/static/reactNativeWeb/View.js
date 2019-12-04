import React from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

const View = props => {
  const p = parseProps(props, 'v')
  if (props.resizeMode) {
    delete props.resizeMode
  }
  if (props.onLoad) {
    delete props.onLoad
  }
  const x = Object.assign({}, props, p)
  if (x.forwardRef) delete x.forwardRef

  if (x.pointerEvents) {
    delete x.pointerEvents
  }

  return React.createElement('div', x, props.children)
}

export default refWrapper(View)
