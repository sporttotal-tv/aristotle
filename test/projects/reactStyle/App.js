import React, { useState, Component } from 'react'
import { Route, Switch, Provider } from 'hub'
import hub from './hub'

const Styled = props => {
  return <div style={props.style}>hello</div>
}

const Styled2 = ({ style }) => {
  // const { style } = props
  return <div style={style}>hello</div>
}

const Styled3 = props => {
  const { style } = props
  return (
    <div
      style={{
        border: '1px solid red',
        ...style
      }}
    >
      hello
    </div>
  )
}

class Styled5 extends Component {
  render() {
    const { style } = this.props
    return (
      <div className={this.props.className} style={style}>
        hello
      </div>
    )
  }
}

class Styled4 extends Component {
  render() {
    return <div style={this.props.style}>hello</div>
  }
}

const Awesome = ({ flap, snurf }) => {
  const [purple, setPurple] = useState(false)
  const bla = {
    border: '1px solid blue'
  }

  const xxx = 100

  const x = purple ? 10 : 5
  const xx = xxx - x

  console.log('xxx', xx, xxx)

  console.log('shurpie', Styled)

  const flaps = purple ? 20 : 10
  return (
    <div
      onClick={() => setPurple(!purple)}
      style={{
        padding: flaps,
        marginBottom: x,
        marginLeft: x,
        marginTop: purple ? 10 : flap ? 5 : snurf ? 1 : -10,
        ...bla
      }}
    >
      hahaha
    </div>
  )
}

const App = () => {
  return (
    <Provider hub={hub} x="1111">
      <Switch>
        <Route
          asyncComponent={async () => import('./Component')}
          path="/x/flups"
        />
        <Route component={Awesome} path="/" />
      </Switch>
    </Provider>
  )
}

export default App
