import React from 'react'

const App = () => {
  return (
    <div
      style={{
        border: '1px solid blue',
        background: 'url("/public/space.jpg")',
        '@font-face': [
          {
            fontFamily: 'Mono',
            fontStyle: 'normal',
            fontWeight: 'normal',
            src: "url(/static/font/mono/light.woff) format('woff')"
          },
          {
            fontFamily: 'Retina',
            fontStyle: 'normal',
            fontWeight: 400,
            src: "url(/static/font/sf/light.woff) format('woff')"
          }
        ],
        ':hover': {
          border: `${~~(Math.random() * 20)}px solid blue`
        }
      }}
    >
      this is reactxxxxxxxxxxxxxxxxxxxx x x x!!!
    </div>
  )
}

export default App
