import redis from 'redis'
import React from 'react'
import './style.css'

console.log(process.env.SMURK)

const Three = ({ style }) => {
  return (
    <div
      className="hello"
      style={{
        backgroundColor: 'blue',
        ...style
      }}
    />
  )
}

const Two = ({ style }) => {
  return <Three style={style} />
}

const One = () => {
  return (
    <Two
      style={{
        border: '1px solid red',
        fontSize: Math.random() * 10
      }}
    />
  )
}

console.log(One)
console.log(process.env.FOO)
