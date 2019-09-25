import React from 'react'

const App = () => {
  return (
    <div
      style={{
        border: '51px solid blue',
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
            fontWeight: '500',
            src: "url(/static/font/sf/light.woff) format('woff')"
          }
        ],
        ':hover': {
          border: `${~~(Math.random() * 120)}px solid blue`
        }
      }}
    >
      no no! do it fun times yeshhh
    </div>
  )
}

export default App
