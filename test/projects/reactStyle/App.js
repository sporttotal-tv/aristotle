import React, { useState, Component } from 'react'
import { Route, Switch, Provider } from 'hub'
import hub from './hub'

// const Bla = {
//   Flap: () => {
//     return <div>HELLO</div>
//   }
// }

// // const Styled = props => {
// //   return <div style={props.style}>hello</div>
// // }

// // const Styled2 = ({ style }) => {
// //   // const { style } = props
// //   return <div style={style}>hello</div>
// // }

// // const Styled3 = props => {
// //   const { style } = props
// //   return (
// //     <div
// //       style={{
// //         border: '1px solid red',
// //         ...style
// //       }}
// //     >
// //       hello
// //     </div>
// //   )
// // }

// class Styled5 extends Component {
//   render() {
//     const { style } = this.props

//     return (
//       <div className={this.props.className} style={style}>
//         hello
//       </div>
//     )
//   }
// }

// // class Styled4 extends Component {
// //   render() {
// //     return <div style={this.props.style}>hello</div>
// //   }
// // }

// const Arrow = ({ color, height = 15, left = 1, style }) => {
//   return left ? (
//     <svg
//       style={style}
//       height={height}
//       width={height}
//       viewBox={`0 0 ${height} ${height}`}
//       fill={color}
//       fillRule="evenodd"
//     >
//       <path d={`M0 0 L 0 ${height}  L ${0.6 * height} ${0.5 * height}  L0 0`} />
//     </svg>
//   ) : (
//     <svg
//       style={style}
//       height={height}
//       width={height}
//       viewBox={`0 0 ${height} ${height}`}
//       fill={color}
//       fillRule="evenodd"
//     >
//       <path
//         d={`M0 ${height} L${height} ${height} L ${height} 0 L0 ${height}`}
//       />
//     </svg>
//   )
// }

// const Awesome = ({ flap, snurf }) => {
//   const [purple, setPurple] = useState(false)
//   const bla = {
//     border: '1px solid blue'
//   }

//   const xxx = 100

//   const x = purple ? 10 : 5
//   const xx = xxx - x

//   const size = 501

//   // console.log('xxx', xx, xxx)

//   // console.log('shurpie', Arrow)

//   const flaps = purple ? 20 : 10
//   return (
//     <div
//       onClick={() => setPurple(!purple)}
//       style={{
//         padding: flaps,
//         marginBottom: x,
//         marginLeft: x,
//         marginTop: purple ? 10 : flap ? 5 : snurf ? 1 : -10,
//         ...bla
//       }}
//     >
//       hahaha
//       <div
//         style={{
//           width: size,
//           minWidth: size
//         }}
//       >
//         dsdssd
//       </div>
//     </div>
//   )
// }

class Blaxxx extends Component {
  render() {
    const smurfen = 50
    console.log('???')
    return (
      <div
        style={{
          height: smurfen,
          minHeight: smurfen
        }}
      >
        gur
      </div>
    )
  }
}

// const App = () => {
//   return (
//     <Provider hub={hub} x="1111">
//       <Switch>
//         <Bla.Flap />
//         <Blaxxx />
//         <Route
//           asyncComponent={async () => import('./Component')}
//           path="/x/flups"
//         />
//         <Route component={Awesome} path="/" />
//       </Switch>
//     </Provider>
//   )
// }

export default Blaxxx
