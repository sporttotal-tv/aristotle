import React, { useState } from 'react'
import { Route, Switch, Provider } from 'hub'
import hub from './hub'

const Awesome = ({ flap, snurf }) => {
  const [purple, setPurple] = useState(false)

  const bla = {
    border: '1px solid blue'
  }

  console.log('xxx')

  const flaps = purple ? 20 : 10
  return (
    <div
      onClick={() => setPurple(!purple)}
      style={{
        padding: flaps,
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

// const X = () => <div style={{}} />
// console.log(App.toString())

export default App
