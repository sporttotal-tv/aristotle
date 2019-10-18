import React, { useRef } from 'react'
import { View } from 'react-native'
setTimeout(async () => {
  const Component = await import('./DynamicSomeModule')
  console.log(Component, React)
}, 100)

// dont add dynamic css when using any style
const App = () => {
  return 'xxxx'
}

console.log('2', useRef, View)

export default App
