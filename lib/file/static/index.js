const buildSingle = require('../buildSingle')
const buildStatic = async props => {
  const {
    store,
    slices,
    traversed,
    dynamicMeta,
    callback,
    styles,
    includeStatic,
    errors,
    type
  } = props
  if (!type) {
    for (let t of ['node', 'browser']) {
      props.type = t
      await buildStatic(props)
    }
    return
  }
  for (let key in includeStatic[type]) {
    await buildSingle(
      store,
      slices,
      require.resolve('./' + key),
      traversed,
      dynamicMeta,
      callback,
      styles,
      includeStatic,
      { len: 0 },
      errors,
      type
    )
  }
}

module.exports = buildStatic
