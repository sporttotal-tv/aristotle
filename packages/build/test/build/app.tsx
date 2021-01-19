import redis from 'redis'
import React, { CSSProperties } from 'react'
import './style.css'

console.log(process.env.SMURK)

const Three = ({ style }) => {
  const a = String(Math.random())
  return (
    <div
      className={a}
      style={{
        backgroundColor: 'blue',
        ...style,
        backgroundColor: 'blue'
      }}
    />
  )
}

const Two = ({ style }) => {
  return <Three style={style} />
}

// const One = () => {
//   return (
//     <Two
//       style={{
//         border: '1px solid red',
//         fontSize: Math.random() * 10
//       }}
//     />
//   )
// }

const One = ({ style }: { style?: CSSProperties }) => {
  return <div style={{ ...style, background: 'red' }}>gurky</div>
}

console.log(One)
console.log(process.env.FOO)
console.log(redis)
