import redis from 'redis'
import React from 'react'
import './style.css'

console.log(process.env.SMURK)

// const Three = ({ style }) => {
//   const a = String(Math.random())
//   return (
//     <div
//       className={a}
//       style={{
//         backgroundColor: 'blue',
//         ...style,
//         backgroundColor: 'blue'
//       }}
//     />
//   )
// }

// const Two = ({ style }) => {
//   return <Three style={style} />
// }

// const x = v => v

// const One = () => {
//   return (
//     <Two
//       style={{
//         border: '1px solid red',
//         fontSize: Math.random() * 10,
//         backgroundColor: x({
//           alpha: 1
//         })
//       }}
//     />
//   )
// }

// const fn = style => {
//   return <div style={style} />
// }

// fn({ border: '1px solid red' })

const KeyFrames = () => {
  return (
    <div
      style={{
        // border: '10px solid red'
        '@keyframes': {
          '0%': {
            transform: 'rotate(0deg)',
            opacity: 0
          }
        }
      }}
    />
  )
}

KeyFrames()

console.log(process.env.FOO, redis)
