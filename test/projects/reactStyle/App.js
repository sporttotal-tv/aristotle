import React from 'react'
import { Route, Switch, Provider } from 'hub'
import hub from './hub'

const App = () => {
  return (
    <Provider hub={hub} x="1111">
      <Switch>
        <Route
          asyncComponent={async () => import('./Component')}
          path="/x/flups"
        />
        <Route
          component={() => (
            <div
              style={{
                background: 'blue',
                padding: 30
                // transform: 'translate('
              }}
            >
              hahaha
            </div>
          )}
          path="/"
        />
      </Switch>
    </Provider>
  )
}

const X = () => <div style={{}} />

// console.log(App.toString())

export default App
