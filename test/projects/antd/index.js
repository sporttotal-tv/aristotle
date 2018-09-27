import React from 'react'
import ReactDOM from 'react-dom'
import { DatePicker } from 'antd'

const App = () => {
  return (
    <div>
      <DatePicker />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('react-root'))
