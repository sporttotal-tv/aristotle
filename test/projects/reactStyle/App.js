import DatePicker from 'react-datetime'

// import 'react-datepicker/dist/react-datepicker.css'

import React from 'react'
// CSS Modules, react-datepicker-cssmodules.css
// import 'react-datepicker/dist/react-datepicker-cssmodules.css';

class Example extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      startDate: new Date(Date.now())
    }
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(date) {
    console.log('???????????????', date)

    this.setState({
      startDate: date
    })
  }

  render() {
    return (
      <DatePicker
        showTimeSelect
        selected={this.state.startDate}
        onChange={this.handleChange}
      />
    )
  }
}

export default Example
