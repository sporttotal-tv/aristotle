import React from 'react'
import { SketchPicker } from 'react-color'
import { render } from 'react-dom'

console.log('hello', SketchPicker)

class Component extends React.Component {
  render() {
    return <SketchPicker />
  }
}

const container = document.createElement('div')
document.body.appendChild(container)
render(<Component />, container)
