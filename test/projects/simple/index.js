import bla from './bla'
require('./x')
if (typeof window !== 'undefined') {
  document.write('fun!')
  document.write(bla)
}
