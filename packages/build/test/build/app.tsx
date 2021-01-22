import redis from 'redis'
import React from 'react'
import './style.css'

// const fn = () => true
console.log(process.env.SMURK)
const RenderComponents = ({ category, grid, bg = 'transparent', a }) => {
  const val = 1
  const s = {
    border: '1px solid red'
  }
  return (
    <div
      style={{
        ...(val
          ? {
              border: '1px solid green'
            }
          : {
              border: '1px solid red'
            })
      }}
    />
  )
}
RenderComponents()

console.log(process.env.FOO, redis)
