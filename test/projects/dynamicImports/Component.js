import React from 'react'
import Deep from './Deep'
import Bla from './Bla'

console.log('exitst times', React)

import('string-hash').then(val => {
  console.log('lullz its string-hash!', val)
})

// import('./Deep').then(val => {
//   console.log('lullz its deep!', val)
// })

export default () => {
  console.log('flapperboy', Deep, Bla)
  return 'XYXYXYX'
  // <div style={{ border: '1px solid blue', fontSize: 13 }}>
  //   Hello this is a div
  // </div>
}
