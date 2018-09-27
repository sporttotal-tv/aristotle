import React from 'react'
import './component.css'
import obj from './something.json'
import extra from './extra'

import('string-hash').then(val => {
  console.log('lullz its string-hash!', val)
})

console.log('?', extra)

setTimeout(() => {
  throw new Error('lullllz')
}, 2000)

export default () => {
  return (
    <div
      style={{
        border: '1px solid blue',
        fontSize: 10,
        background: 'purple'
      }}
    >
      {obj.field} this is a div
    </div>
  )
}
