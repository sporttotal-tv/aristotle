import React, { Component } from 'react'
import { render } from 'react-dom'

import ReactDropzone from 'react-dropzone'

class App extends Component {
  onDrop = files => {
    // POST to a test endpoint for demo purposes
  }

  render() {
    return (
      <div className="app">
        <ReactDropzone onDrop={this.onDrop}>
          Drop your best gator GIFs here!!
        </ReactDropzone>
      </div>
    )
  }
}

const container = document.createElement('div')
document.body.appendChild(container)
render(<App />, container)
