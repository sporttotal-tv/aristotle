const isAncestor = (scope, check) => {
  var p = scope
  while (p) {
    if (check === p) {
      return true
    }
    p = p.parent
  }
}

module.exports = isAncestor
