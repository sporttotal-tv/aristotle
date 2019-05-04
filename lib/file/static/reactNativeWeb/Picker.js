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
  const p = parseProps(props, 'v t _p')
  p.selected = !!props.selectedValue
  p.value = props.selectedValue
  // onValueChange
  p.autoComplete = 'off'
  p.onChange = e => {
    props.onValueChange(e.target.value)
    e.target.blur()
  }

  // p.ref = e => {
  //   if (e) {
  //     e.childNodes.forEach(v => {
  //       if (v.value === props.selectedValue) {
  //         v.setAttribute('selected', true)
  //       } else {
  //         v.removeAttribute('selected')
  //       }
  //     })
  //   }
  // }

  console.log(p.style, p.className)

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
