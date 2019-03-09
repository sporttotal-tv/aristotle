import React, { Component } from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

class ScrollView extends Component {
  listener(e) {
    const target = e.target
    if (!this.ticking) {
      global.requestAnimationFrame(() => {
        this.props.onScroll({
          nativeEvent: {
            contentOffset: {
              y: target.scrollTop,
              x: target.scrollLeft
            }
          }
        })
        this.ticking = false
      })
      this.ticking = true
    }
  }
  render() {
    const props = this.props
    // 3rd argument component class
    const p = parseProps(props, 'v')

    const {
      horizontal,
      onScroll,
      // scrollEventThrottle,
      contentContainerStyle
    } = props

    // also add all methods on the ref (ref decoration)

    const children =
      props.children && contentContainerStyle
        ? Array.isArray(props.children)
          ? props.children.map(c =>
              // transpile this with aristotle
              React.cloneElement(c, { style: contentContainerStyle })
            )
          : React.cloneElement(props.children, { style: contentContainerStyle })
        : props.children

    return (
      <div
        ref={p.ref}
        onScroll={onScroll ? e => this.listener(e) : void 0}
        className={p.className || ''}
        style={{
          overflowY: horizontal ? 'hidden' : 'scroll',
          overflowX: horizontal ? 'scroll' : 'hidden',
          height: '100%',
          flexBasis: 0,
          width: '100%',
          maxHeight: '100%',
          minHeight: '100%',
          '-webkit-overflow-scrolling': 'touch',
          ...p.style
        }}
      >
        {children}
      </div>
    )
  }
}

export default refWrapper(ScrollView)
