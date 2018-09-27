const Bundle = require('./bundle')

const { generateCode } = require('./code')

const isTraversed = (bundle, path) => {
  var t
  while (bundle) {
    if (bundle.traversed[path]) {
      t = bundle
    }
    bundle = bundle.parent
  }
  return t
}

const createBundle = ({ file, store, type }) => {
  const refs = {}
  const bundleMap = {}
  const walk = (file, parseDependencies, bundle) => {
    const start = !bundle.initialized
    bundle.initialized = true
    const path = file.path
    const files = bundle.files
    const traversedInBundle = isTraversed(bundle, path)
    if (!traversedInBundle) {
      bundle.traversed[path] = true
      if (parseDependencies) {
        if (!file[type].dependencies) {
          console.log('ok strange', type, file.path)
        }

        file[type].dependencies.forEach(val => {
          if (!val.path) {
            // this is something that cant be resolved - default to keeping 'require' - sometimes used in enviroments like electron
          } else if (type === 'browser' && val.type === 'dynamic') {
            bundle.dynamicBundles.push(val)
          } else {
            walk(store.files[val.path], val.parseDependencies[type], bundle)
          }
        })
      }

      files.push(file)

      if (start) {
        bundle.dynamicBundles.forEach(val => {
          const newBundle = (bundle.bundles[val.path] = new Bundle(
            bundle,
            bundle.store.files[val.path].path,
            store,
            bundle.store.files[val.path].id,
            bundle.store.files[val.path]
          ))
          bundleMap[val.path] = newBundle
          const traversedInBundle = isTraversed(bundle, val.path)
          if (traversedInBundle) {
            newBundle.requiredInBundle = traversedInBundle
          }
          walk(store.files[val.path], val.parseDependencies[type], newBundle)
        })
      }
    } else if (bundle.parent && traversedInBundle !== bundle) {
      refs[path] = traversedInBundle
    }
  }

  const bundle = new Bundle(false, file.path, store, file.id, file)

  walk(file, true, bundle)

  bundle.isRoot = true

  generateCode({ bundle, refs, bundleMap, type })

  return bundle
}

exports.createBundle = createBundle
