const excludeNodeModules = ['redis']
// also add from pkg.json
module.exports = (module, store) => {
  if (
    excludeNodeModules.indexOf(module) !== -1 ||
    (store.pkg &&
      store.pkg.aristotle &&
      store.pkg.aristotle.excludes &&
      store.pkg.aristotle.excludes.indexOf(module) !== -1)
  ) {
    return true
  }
}
