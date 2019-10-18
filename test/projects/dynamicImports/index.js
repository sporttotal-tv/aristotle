import React, { useRef } from 'react'
setTimeout(async () => {
  const Component = await import('./Component')
  console.log(Component, React)
}, 100)

// dont add dynamic css when using any style
const App = () => {
  return 'xxxx'
}

console.log('FLAPDROL', useRef)

export default App
