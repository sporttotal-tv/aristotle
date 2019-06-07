import React from 'react'
import './react-native.css'
import parseProps from './props'

// const freeze = e => {
//   document.body.scrollTop = 0
//   document.body.scrollLeft = 0
//   e.preventDefault()
// }

const Picker = props => {
  const p = parseProps(props, 'v t _p')
  p.selected = !!props.selectedValue
  p.value = props.selectedValue
  p.autoComplete = 'off'
  p.onChange = e => {
    props.onValueChange(e.target.value)
  }
  return React.createElement(
    'div',
    {
      className: props.className,
      style: props.style
    },
    React.createElement('select', p, props.children)
  )
}

const Item = props => {
  const { label, value } = props
  const p = parseProps(props)
  return React.createElement(
    'option',
    { value, style: p.style, className: p.className || '' },
    label
  )
}

Picker.Item = Item

export default Picker
export { Item }
