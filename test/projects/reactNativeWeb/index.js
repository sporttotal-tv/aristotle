import ReactDOM from 'react-dom'
import React from 'react'
import Image2 from './x'
import {
  View,
  Text,
  Image,
  Animated,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity
} from 'react-native'

const App = () => {
  const children = []

  for (let i = 0; i < 200; i++) {
    children.push(
      <Text style={{ marginLeft: 30 }} key={i}>
        hello {i}
      </Text>
    )
  }

  return (
    <View
      ref={e => {
        console.log('x yes', e)
      }}
      style={{
        width: '100%',
        height: '50vh'
      }}
    >
      <TouchableOpacity>
        <Text>CLICK IT</Text>
      </TouchableOpacity>
      <Animated.View>
        <Text>xxx</Text>
      </Animated.View>
      <ScrollView
        contentContainerStyle={{
          border: '10px solid blue'
        }}
        onScroll={e => {
          console.log('xxx', e.nativeEvent.contentOffset.x)
        }}
        ref={e => {
          console.log('this!')
          e.measure((x, y, w, h, px, py) => {
            console.log(w, h, px, py)
          })
        }}
        horizontal
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
          border: '1px solid blue'
        }}
      >
        {children}
      </ScrollView>
    </View>
  )
}

console.log('hello', Image, Image2, ActivityIndicator)

ReactDOM.render(<App />, document.body)

// AppRegistry.registerComponent('x', () => App)

// AppRegistry.runApplication('x', {
//   rootTag: document.body
// })
