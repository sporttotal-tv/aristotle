import ReactDOM from 'react-dom'
import React from 'react'
import Image2 from './x'
import { View, Text, Image, Animated, ActivityIndicator } from 'react-native'

const App = () => {
  return (
    <View>
      <Text>xxxxxxxxxxxxxxxxx</Text>
      <Animated.View>
        <Text>xxx</Text>
      </Animated.View>
    </View>
  )
}

console.log('hello', Image, Image2, ActivityIndicator)

ReactDOM.render(<App />, document.body)

// AppRegistry.registerComponent('x', () => App)

// AppRegistry.runApplication('x', {
//   rootTag: document.body
// })
