import React from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

const TextInput = props => {
  const p = parseProps(props, 'v ')

  // p.autoCapitalize = 'sentences'
  p.autoComplete = 'on'
  // p.autoCorrect = 'on'
  p.dir = 'auto'
  // p.spellCheck = true
  p.type = 'text'
  p['data-focusable'] = true
  p.placeholder = props.placeholder
  p.value = props.value
  if (props.onChangeText) {
    p.onChange = e => {
      props.onChangeText(e.target.value)
    }
  }
  if (props.onBlur) {
    p.onBlur = e => {
      props.onBlur()
    }
  }
  if (props.onFocus) {
    p.onFocus = e => {
      props.onFocus()
    }
  }
  // value
  if (props.placeholderTextColor) {
    return (
      <input
        {...p}
        className={p.className}
        style={{
          ...p.style,
          '::placeholder': { color: props.placeholderTextColor }
        }}
      />
    )
  } else {
    return React.createElement('input', p)
  }
}

export default refWrapper(TextInput)
