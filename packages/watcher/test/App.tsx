import { findNodeAround } from 'acorn-walk'
import React from 'react'

const Purf = ({ style }) => {
  return <div style={style}>PERV</div>
}

// const Snurk = ({ style }) => {
//   const r = (
//     <div
//       style={{
//         animation: 'x 1s linear infinite',
//         '@keyframes': {
//           '0%': {
//             opacity: 0
//           },
//           '50%': {
//             opacity: 1
//           },
//           '100%': {
//             opacity: 0,
//             transform: 'rotate(360deg)'
//           }
//         }
//       }}
//     >
//       YESH REACTxxxx
//       <Purf style={style} />
//     </div>
//   )

//   return r
// }

const functi2 = () => true

export default () => (
  <div
    style={{
      // border: true ? '10px solid red' : '10px solid orange',
      background: functi2({
        fontFace: 'whatver'
      }),
      fontSize: 36,
      border: functi2()
        ? true
          ? '10px solid red'
          : '10px solid blue'
        : 1
        ? '10px solid green'
        : null,
      animationDuration: '1s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      '@keyframes': {
        '0%': {
          opacity: true
        },
        '50%': {
          opacity: 1
        },
        '100%': {
          opacity: 0,
          transform: 'rotate(360deg)'
        }
      }
    }}
  >
    YOYYO
  </div>
)
