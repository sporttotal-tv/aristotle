import React from 'react'
import './react-native.css'
import parseProps from './props'

const Picker = props => {
  // itemStyle for ios
  // prompt for android
  /*
  {
    style,
    onValueChange,
    selectedValue,
    children,
    prompt,
    itemStyle
  }
  */
  const p = parseProps(props, 'v t')
  p.selected = props.selectedValue
  p.onChange = p.onValueChange
  return React.createElement('select', p, props.children)
}

const Item = ({ label, value }) => {
  return React.createElement('option', { value }, label)
}

Picker.Item = Item

export default Picker
export { Item }
