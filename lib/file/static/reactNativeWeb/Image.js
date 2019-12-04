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

  if (p.onLoad && !isNode) {
    if (props.source && props.source.uri) {
      if (!imageLoaders[props.source.uri]) {
        const img = new Image()
        imageLoaders[props.source.uri] = img
        img.onload = () => {
          imageLoaders[props.source.uri] = true
          p.onLoad()
        }
        img.src = props.source.uri
      } else {
        setTimeout(() => p.onLoad(), 0)
      }
    }
  }

  return React.createElement('div', p)
}

export default Image
