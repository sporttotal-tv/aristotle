import React from 'react'

// const Purf = ({ style }) => {
//   return <div style={style} />
// }

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
      {/* <Purf style={style} /> */}
    </div>
  )

  setTimeout(() => console.log(xxxsx))

  return r
}

export default () => (
  <Snurk
    style={{
      border: '1px solid red'
    }}
  />
)
