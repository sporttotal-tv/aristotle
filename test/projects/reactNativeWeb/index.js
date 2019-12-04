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

const images = [
  'https://www.rtlnieuws.nl/sites/default/files/styles/liggend/public/content/images/2019/07/28/The-Lion-King-OV-_st_1_jpg_sd-high_%C2%A9-2019-Disney-Enterprises-Inc-All-Rights-Reserved.jpg?itok=jwpKUA67',
  'https://www.yannarthusbertrandphoto.com/wp-content/uploads/2019/09/yab_hook_lion_kenya_yann-arthus-bertrand.jpeg',
  'https://www.nestle-cereals.com/be/sites/g/files/qirczx551/f/styles/scale_992/public/stage_visual/be_lion_lion-regular_2048_x_1152_visuel-produit_01_0.jpg?itok=AvCCM90f'
]

class ImageLoader extends React.Component {
  state = {
    opacity: new Animated.Value(0)
  }

  onLoad = () => {
    console.log('bitch load')
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: true
    }).start()
  }

  render() {
    return (
      <View
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <Image
          {...this.props}
          source={this.props.prev}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
        />
        <Animated.Image
          onLoad={this.onLoad}
          source={this.props.source}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: this.state.opacity
          }}
        />
      </View>
    )
  }
}

const Poop = () => {
  const img = images[0]
  const prev = images[images.length - 1]
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0
      }}
    >
      <ImageLoader
        prev={{ uri: prev }}
        source={{ uri: img }}
        resizeMode="cover"
      />
    </View>
  )
}

console.log(Poop)

const App = () => {
  // const children = []

  // for (let i = 0; i < 200; i++) {
  //   children.push(
  //     <Text style={{ marginLeft: 30 }} key={i}>
  //       hello {i}
  //     </Text>
  //   )
  // }

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
      <Poop />
      {/* <TouchableOpacity>
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
      </ScrollView> */}
    </View>
  )
}

// console.log('hello', Image, Image2, ActivityIndicator)

ReactDOM.render(<App />, document.body)

// AppRegistry.registerComponent('x', () => App)

// AppRegistry.runApplication('x', {
//   rootTag: document.body
// })
