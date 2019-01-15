import bla from './bla'

console.log(bla)

const foo = () => {
  const bla = {
    bla: true
  }
  const x = {}
  x.bla = bla
  console.log(x)
  return bla
}

foo()
