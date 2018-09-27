import got from 'npm-exists'
import React from 'react'

console.log('exitst times', got)

import('string-hash').then(val => {
  console.log('lullz its string-hash!', val)
})

// import('./Deep').then(val => {
//   console.log('lullz its deep!', val)
// })

export default () => {
  return (
    <div style={{ border: '1px solid blue', fontSize: 13 }}>
      Hello this is a div
    </div>
  )
}
