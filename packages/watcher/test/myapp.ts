import './css.css'
import App from './App'
import reactDom from 'react-dom'

console.log(App)

// App()

reactDom.render(App(), document.getElementById('react'))

console.info(
  'this is an YUZI NICEEExx ?',
  process.env.NODE_ENV,
  process.env.NVM_DIR
)
