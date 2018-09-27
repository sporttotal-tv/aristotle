import React from 'react'
import shurf from './shurf.css'

setTimeout(async () => {
  const Component = await import('./Component')
  console.log(Component, shurf)
}, 100)

console.log('???')

const App = () => (
  <div
    style={{
      fontSize: 13,
      ':hover': { border: `${Math.random() * 100}px solid pink` }
    }}
  >
    Hello
  </div>
)

export default App
