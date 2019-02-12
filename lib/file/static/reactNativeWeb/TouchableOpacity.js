import React, { Component } from 'react'
import './react-native.css'
import parseProps from './props'

class TouchableOpacity extends Component {
  render() {
    const props = this.props
    const p = parseProps(props, 'v')
    if (props.onPress) {
      p.onClick = props.onPress
    }
    return React.createElement('a', p, props.children)
  }
}

export default TouchableOpacity
