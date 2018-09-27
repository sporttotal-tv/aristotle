const x = require('./x')

const blurf = obj => {
  obj.flups = 'hahaha'
  obj.flaps = 'xxxx'
}

console.log(x.default)

const bla = x.default

console.log(bla)

blurf(exports)
