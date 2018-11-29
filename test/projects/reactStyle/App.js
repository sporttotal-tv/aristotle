import React, { useState } from 'react'
import { Route, Switch, Provider } from 'hub'
import hub from './hub'

const Awesome = () => {
  const [purple, setPurple] = useState(false)
  return (
    <div
      onClick={() => setPurple(!purple)}
      style={{
        background: purple ? 'purple' : 'blue',
        padding: 30,
        display: 'flex'
        // transform: 'translate('
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
