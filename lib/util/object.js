const mergeMethods = (...objects) => {
  const obj = {}

  objects.forEach(val => {
    for (let key in val) {
      if (!obj[key]) {
        obj[key] = val[key]
      } else {
        const prev = obj[key]
        obj[key] = function(...args) {
          prev.apply(this, args)
          val[key].apply(this, args)
        }
      }
    }
  })
  return obj
}

exports.mergeMethodsArgs = (methods, ...args) => {
  const obj = mergeMethods(...methods)
  if (args) {
    for (let key in obj) {
      const fn = obj[key]
      obj[key] = function(node) {
        return fn.apply(this, [node, ...args])
      }
    }
  }
  return obj
}

exports.mergeMethods = mergeMethods
