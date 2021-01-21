import redis from 'redis'
import React from 'react'
import './style.css'

// const fn = () => true
console.log(process.env.SMURK)
const KeyFrames = ({ style }) => {
  const value = 1
  return (
    <div
      // style={{
      //   '@media (max-width:snurk)': {
      //     border: '1px solid red'
      //   }
      // }}
      // className="smurky"
      style={
        value
          ? {
              background: 'red',
              // background: value ? 'blue' : null,
              // background: 'green',
              fontSize: Math.random()
            }
          : null
      }
    />
  )
}

// function bla() {
//   console.log('!!!')
//   return
// }

KeyFrames()

console.log(process.env.FOO, redis)
