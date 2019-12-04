import ReactDOM from 'react-dom'
import React, { useEffect, useReducer } from 'react'
import { View, Image, Animated } from 'react-native'
// import { useHub } from '@saulx/hub'
// import { rgba } from '@sporttotaltv/v2-ui-utils'

const images = [
  'https://www.rtlnieuws.nl/sites/default/files/styles/liggend/public/content/images/2019/07/28/The-Lion-King-OV-_st_1_jpg_sd-high_%C2%A9-2019-Disney-Enterprises-Inc-All-Rights-Reserved.jpg?itok=jwpKUA67',
  'https://www.yannarthusbertrandphoto.com/wp-content/uploads/2019/09/yab_hook_lion_kenya_yann-arthus-bertrand.jpeg',
  'https://www.nestle-cereals.com/be/sites/g/files/qirczx551/f/styles/scale_992/public/stage_visual/be_lion_lion-regular_2048_x_1152_visuel-produit_01_0.jpg?itok=AvCCM90f'
]

class ImageLoader extends React.Component {
  constructor(props) {
    super()
    this.state.img = props.img
  }

  state = {
    opacity: new Animated.Value(0)
  }

  onLoad = () => {
    console.log('go')
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true
    }).start()
  }

  componentWillReceiveProps(nextProps) {
    console.log('ok go-0--', nextProps)
    if (nextProps.img !== this.state.img && !this._timer) {
      this._timer = setTimeout(() => {
        console.log('reset opacity')
        this.state.opacity.setValue(0)
        this._timer = setTimeout(() => {
          console.log('set state')
          this.setState({ img: nextProps.img })
          this._timer = setTimeout(() => {
            this._timer = false
          })
        }, 500)
      }, 500)
    }
  }

  shouldComponentUpdate(n, ns) {
    return this.state.img !== ns.img
  }

  render() {
    console.log('set img', this.state.img)

    return (
      <View
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <Animated.Image
          onLoad={this.onLoad}
          resizeMode="cover"
          source={{ uri: this.state.img }}
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

const reducer = (state, arr) => {
  if (state === arr.length - 1) {
    return 0
  }
  return ++state
}
const App = () => {
  const [index, update] = useReducer(reducer, 0)

  const prev = images[index === 0 ? images.length - 1 : index - 1]
  const img = images[index]

  useEffect(() => {
    const interval = setInterval(() => {
      update(images)
    }, 4000)
    return () => {
      clearInterval(interval)
    }
  }, [])

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
      <Image
        resizeMode="cover"
        source={{ uri: prev }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%'
        }}
      />
      <ImageLoader img={img} />
    </View>
  )
}

ReactDOM.render(<App />, document.body)

// AppRegistry.registerComponent('x', () => App)

// AppRegistry.runApplication('x', {
//   rootTag: document.body
// })
