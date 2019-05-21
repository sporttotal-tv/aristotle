import bla from 'date-fns'
import DatePicker from 'react-datepicker'

// import 'react-datepicker/dist/react-datepicker.css'

import React from 'react'
import ReactDom from 'react-dom'
// CSS Modules, react-datepicker-cssmodules.css
// import 'react-datepicker/dist/react-datepicker-cssmodules.css';

class Example extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      startDate: new Date()
    }
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(date) {
    this.setState({
      startDate: date
    })
  }

  render() {
    return (
      <DatePicker
        showTimeSelect
        dateFormat="Pp"
        selected={this.state.startDate}
        onChange={this.handleChange}
      />
    )
  }
}

ReactDom.render(<Example />, document.body)
