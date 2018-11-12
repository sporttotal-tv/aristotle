import React from 'react'
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

// global.Bla = Bla

console.log('xxx', Bla)
