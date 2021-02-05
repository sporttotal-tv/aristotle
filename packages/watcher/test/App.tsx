import { findNodeAround } from 'acorn-walk'
import React, { useState } from 'react'

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

const App = () => {
  const [state, setState] = useState('A')
  return (
    <div
      onClick={() => {
        setState(state === 'A' ? 'B' : 'A')
      }}
      style={{
        fontSize: 60,
        color: 'white',
        border: state === 'A' ? '10px solid orange' : '10px solid blue',
        animationDuration: '5s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        '@keyframes':
          state === 'A'
            ? {
                '0%': {
                  opacity: 1,
                  transform: 'rotate(0deg)'
                },
                '50%': {
                  opacity: 1,
                  transform: 'rotate(0deg)'
                },

                '100%': {
                  opacity: 0,
                  transform: 'rotate(360deg)'
                }
              }
            : {
                '0%': {
                  opacity: 1,
                  transform: 'rotate(0deg)'
                },
                '100%': {
                  opacity: 0,
                  transform: 'rotate(-360deg)'
                }
              }
      }}
    >
      {new Array(12).fill(state)}
    </div>
  )
}

export default () => <App />
