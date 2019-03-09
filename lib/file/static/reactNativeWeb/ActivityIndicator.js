import React from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

const createSvgCircle = style => (
  <circle cx="16" cy="16" fill="none" r="14" strokeWidth="4" style={style} />
)

const ActivityIndicator = props => {
  const p = parseProps(props, 'v')
  let { color = '#000', size = 100 } = props
  if (size === 'small') {
    size = 20
  } else if (size === 'large') {
    size = 36
  }

  const svg = (
    <svg height="100%" viewBox="0 0 32 32" width="100%">
      {createSvgCircle({
        stroke: color,
        opacity: 0.2
      })}
      {createSvgCircle({
        stroke: color,
        strokeDasharray: 80,
        strokeDashoffset: 60
      })}
    </svg>
  )

  return (
    <div
      className="v"
      ref={p.ref}
      style={{
        width: size,
        height: size,
        animationDuration: '0.75s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationName: 'rotate',
        '@keyframes': {
          rotate: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }
      }}
    >
      {svg}
    </div>
  )
}

export default refWrapper(ActivityIndicator)
