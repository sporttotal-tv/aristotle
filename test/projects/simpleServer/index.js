import React from 'react'
import App from './App'
import ReactDOM from 'react-dom'

const styleThing = {
  background: 'red'
}

const Bla = ({ style }) => {
  const parseThis = Object.assign(
    {
      border: '15px solid blue'
    },
    styleThing,
    style
  )
  return (
    <div style={parseThis}>
      <App />
    </div>
  )
}

console.log('x app ==>', Bla)

ReactDOM.render(<Bla />, document.body)
