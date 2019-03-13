const uid = num => {
  const div = (num / 26) | 0
  var str = String.fromCharCode(97 + (num % 26))
  if (div) {
    if ((div / 26) | 0) {
      str = str + uid(div)
    } else {
      str = str + String.fromCharCode(97 + (div % 26))
    }
  }
  return str
}

module.exports = uid
