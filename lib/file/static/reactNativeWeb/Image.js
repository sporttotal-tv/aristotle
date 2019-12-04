import React from 'react'
import './react-native.css'
import parseProps from './props'

const imageLoaders = {}

const isNode = typeof window === 'undefined'

const Image = props => {
  const p = parseProps(props, 'i')
  if (props.source) {
    if (!p.style) {
      p.style = {}
    }
    p.style.backgroundImage = 'url(' + props.source.uri + ')'
    if (props.resizeMode) {
      p.style.backgroundSize = props.resizeMode
    }
  }

  if (props.onLoad && !isNode) {
    if (props.source && props.source.uri) {
      if (!imageLoaders[props.source.uri]) {
        const img = new global.Image()
        imageLoaders[props.source.uri] = img
        img.onload = () => {
          imageLoaders[props.source.uri] = true
          setTimeout(() => props.onLoad(), 10)
        }
        img.src = props.source.uri
      } else {
        setTimeout(() => props.onLoad(), 0)
      }
    }
  }

  return React.createElement('div', p)
}

export default Image
