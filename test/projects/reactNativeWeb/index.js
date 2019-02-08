import React from 'react'
import { View, Text } from 'react-native'
import ReactDOM from 'react-dom'

const App = () => {
  return (
    <View>
      <Text>xx</Text>
    </View>
  )
}

console.log('hello', View)

ReactDOM.render(<App />, document.body)

// AppRegistry.registerComponent('x', () => App)

// AppRegistry.runApplication('x', {
//   rootTag: document.body
// })
