function b() {}

function a() {
  if ('production' === 'production') {
    return
  }

  var c = b()

  if (!c) {
    return
  }
}

module.exports = a
