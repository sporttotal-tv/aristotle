import React from 'react'

setTimeout(async () => {
  const Component = await import('./Component')
  console.log(Component)
}, 100)

// dont add dynamic css when using any style
const App = () => (
  <div
    style={{
      fontSize: '13',
      ':hover': { border: `${Math.random() * 100}px solid pink` }
    }}
  >
    Hello
  </div>
)
export default App
