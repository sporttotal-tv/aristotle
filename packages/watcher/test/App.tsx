import React from 'react'

const Purf = ({ style }) => {
  return <div style={style}>PERV</div>
}

const Snurk = ({ style }) => {
  const r = (
    <div
      className="shine on"
      style={{
        ...style,
        backgroundColor: 'green', // jonko
        color: 'white',
        ':hover': {
          color: 'blue'
        }
      }}
    >
      YESH REACTxxxx
      <Purf style={style} />
    </div>
  )

  return r
}

export default () => (
  <Snurk
    style={{
      border: '10px solid red'
    }}
  />
)

console.info(Snurk)