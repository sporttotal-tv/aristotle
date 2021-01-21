import redis from 'redis'
import React from 'react'
import './style.css'

// const fn = () => true
console.log(process.env.SMURK)
const RenderComponents = ({ category, grid, bg = 'transparent' }) => {
  const s: CSSProperties = {
    padding: '20px',
    borderRadius: '7px',
    display: 'flex',
    flexWrap: grid ? 'wrap' : 'nowrap',
    backgroundColor: bg,
    flexDirection: grid ? 'row' : 'column'
  }
  return <div style={s} />
}
RenderComponents()

console.log(process.env.FOO, redis)
