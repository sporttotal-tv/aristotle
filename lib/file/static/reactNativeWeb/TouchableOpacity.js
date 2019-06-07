import React, { Component } from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

// fix this for tv!

/*
ref={this.ref}
onPress={this.onPress}
activeOpacity={withoutFeedback ? 1 : 0.2}
*/

class TouchableOpacity extends Component {
  render() {
    const props = this.props
    const p = parseProps(props, 'v')
    const activeOpacity = props.activeOpacity || 0.5
    if (props.onPress) {
      p.onClick = props.onPress
    }

    if (props.onPressIn) {
      p.onMouseDown = props.onPress
    }

    for (let key in props) {
      if (key !== 'onPress' && key !== 'onPressIn' && key.indexOf('on') === 0) {
        p[key] = props[key]
      }
    }

    const { style, className, ...pProps } = p

    if (pProps.onClick) {
      const onClick = pProps.onClick
      pProps.onClick = e => {
        e.preventDefault()
        onClick(e)
      }
    }

    return (
      <a
        href={this.props.to}
        style={{
          ':active': { opacity: activeOpacity },
          cursor: 'pointer',
          ...style
        }}
        className={className}
        {...pProps}
      >
        {props.children}
      </a>
    )
  }
}

export default refWrapper(TouchableOpacity)
