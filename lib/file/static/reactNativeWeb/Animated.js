import React, { Component } from 'react'
import './react-native.css'
import NormalView from './View'

const isNode = typeof window === 'undefined'

class Value {
  constructor(val) {
    this._val = val
    this._start = val
  }
  start() {
    this.animating = true
  }
  stop() {
    // does not rly work yet
    this.animating = false
  }
  nextFrame() {
    this._val = this.toValue
    this.animating = false
  }
  updateAnimation(props) {
    let updated = false
    if (props.toValue !== this.toValue) {
      this.toValue = props.toValue
      updated = true
    }

    if (props.duration !== this.duration) {
      this.duration = props.duration
      updated = true
    }
    if (updated) {
      if (this.component) {
        this.component.updateAnimation()
      }
    }
  }
}

class ValueXY {
  constructor() {
    console.error('did not implement Value XY yet!')
  }
}

const parseStyleArray = arr => {
  const style = {}
  arr.forEach(val => {
    Object.assign(style, val)
  })
}

class View extends Component {
  state = {
    values: {},
    style: {}
  }
  updateAnimation(force) {
    if (!isNode) {
      if (!this.inProgress || force) {
        this.inProgress = true
        let next
        global.requestAnimationFrame(() => {
          const transition = []
          const styleState = { ...this.state.style }
          const values = this.state.values
          for (let key in values) {
            const value = values[key]
            if (value.animating) {
              value.nextFrame()
              next = true
            }
            if (value.duration) {
              transition.push(`${key} ${value.duration}ms`)
            }
            styleState[key] = values[key]._val
          }
          if (next) {
            this.updateAnimation(true)
          } else {
            this.inProgress = false
          }
          styleState.transition = transition.join(',')
          this.setState({ style: styleState, values })
        })
      }
    }
  }
  parseStyle(style) {
    const transition = []
    const styleState = {}
    const values = this.state.values
    if (Array.isArray(style)) {
      style = parseStyleArray(style)
    }
    for (let key in style) {
      if (style[key] instanceof Value) {
        if (!values[key]) {
          const value = style[key]
          values[key] = value
          value.component = this
          styleState[key] = value._val
          if (value.animating) {
            value.start()
          }
          if (value.duration) {
            transition.push(`${key} ${value.duration}ms`)
          }
        } else {
          const value = values[key]
          styleState[key] = value._val
          if (value.duration) {
            transition.push(`${key} ${value.duration}ms`)
          }
        }
      } else {
        if (
          style[key] === false ||
          style[key] === void 0 ||
          isNaN(style[key])
        ) {
        } else {
          styleState[key] = style[key]
        }
      }
    }
    styleState.transition = transition.join(',')
    this.setState({
      style: styleState,
      values
    })
  }
  componentWillReceiveProps(next) {
    if (next.style) {
      if (this.props.style) {
        // calc props check if diff
        this.parseStyle(next.style)
      } else {
        this.parseStyle(next.style)
      }
    }
  }
  componentWillMount() {
    this.parseStyle(this.props.style)
  }
  render() {
    return <NormalView {...this.props} style={this.state.style} />
  }
}

/*
    Animated.timing(this.state.opacity, {
      toValue: isPlaying ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start()
*/
const timing = (v, props) => {
  v.updateAnimation(props)
  return v
}

// did not implement this yet
// parallel
// stopAll
// divided
// interpolate
// event

console.warn(
  '😱 Animated api is implemented to 1% of its full implementation (only single values) - use with care!'
)

const all = {
  Value,
  View,
  ValueXY,
  timing
}

export default all

export { Value, View, ValueXY, timing }
