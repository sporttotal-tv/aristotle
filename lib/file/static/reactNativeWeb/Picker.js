import React from 'react'
import './react-native.css'
import parseProps from './props'

const Picker = props => {
  const p = parseProps(props, 'v t _p')
  p.selected = !!props.selectedValue
  p.value = props.selectedValue
  p.autoComplete = 'off'
  p.onChange = e => {
    props.onValueChange(e.target.value)
    // e.target.blur()
  }
  return React.createElement(
    'div',
    { className: props.className, style: props.style },
    React.createElement('select', p, props.children)
  )
}

const Item = ({ label, value }) => {
  return React.createElement('option', { value }, label)
}

Picker.Item = Item

export default Picker
export { Item }
