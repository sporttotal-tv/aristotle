const React = require('react')
require('./bla.css')
const ReactDom = require('react-dom')

const Datetime = require('react-datetime')

class MyDTPicker extends React.Component {
  render() {
    return <Datetime locale="de" />
  }
}

ReactDom.render(<MyDTPicker />, document.body)
