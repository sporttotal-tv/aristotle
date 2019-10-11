const excludeNodeModules = ['redis']

// also add from pkg.json
module.exports = (module, store) => {
  // do it

  //   console.log(store

  if (
    excludeNodeModules.indexOf(module) !== -1 ||
    (store.pkg &&
      store.pkg.aristotle &&
      store.pkg.aristotle.excludes &&
      store.pkg.aristotle.excludes.indexOf(module) !== -1)
  ) {
    console.log('  - Exclude', module, 'from parsing in node.js')
    store.nodeModules.push(module)
    return true
  }
}
