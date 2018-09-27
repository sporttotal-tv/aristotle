import React from 'react'
import ReactDOM from 'react-dom'
import ua from 'vigour-ua'

const blue = 'blue'

const Bla = () => {
  const styleX = {
    height: 500,
    fontFamily: 'andale mono'
  }

  return (
    <div
      style={{
        ...styleX,
        border: '100px solid blue',
        background: 'grey',
        '::-webkit-overflow-scrolling': 'touch',
        ':hover': {
          color: blue
        }
      }}
    >
      hahaha
    </div>
  )
}

const wait = () => new Promise(resolve => setTimeout(resolve, 100))

console.log(Bla, ua)

import('./Component').then(async val => {
  await wait()
  console.log('LOAD Component', val)
})

ReactDOM.render(<Bla />, document.body)
