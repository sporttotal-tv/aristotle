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

    const { style, ...pProps } = p

    return (
      <div
        style={{
          ':active': { opacity: activeOpacity },
          ...style
        }}
        {...pProps}
      >
        {props.children}
      </div>
    )
  }
}

export default refWrapper(TouchableOpacity)
