const Bundle = require('./bundle')

const { generateCode } = require('./code')

// removed REACT & HUB from the parsing in bundles

const isTraversed = (bundle, path, store, log) => {
  var t

  while (bundle) {
    if (bundle.traversed[path]) {
      t = bundle
    }
    bundle = bundle.parent
  }

  return t
}

const createBundle = async ({ file, store, type }) => {
  if (file.error) {
    const bundle = new Bundle(false, file.path, store, file.id, file)
    bundle.errors = { [file.path]: file }
    bundle.isRoot = true
    bundle.code = ''
    bundle.es2015 = ''
    bundle.codeHash = 'empty'
    bundle.es2015Hash = 'empty'
    bundle.css = ''
    return bundle
  } else {
    const refs = {}
    const bundleMap = {}
    const walk = (file, parseDependencies, bundle, from) => {
      if (file) {
        const start = !bundle.initialized
        bundle.initialized = true
        const path = file.path
        const files = bundle.files

        const traversedInBundle = isTraversed(bundle, path, store)

        if (!traversedInBundle) {
          bundle.traversed[path] = true

          if (parseDependencies) {
            if (!file[type].dependencies) {
            } else {
              file[type].dependencies.forEach(val => {
                if (!val.path) {
                  // this is something that cant be resolved - default to keeping 'require' - sometimes used in environments like electron
                } else if (type === 'browser' && val.type === 'dynamic') {
                  bundle.dynamicBundles.push(val)
                } else {
                  const depFile = store.files[val.path]

                  // if (
                  //   !depFile
                  //   // ((val.path.indexOf('react') !== -1 ||
                  //   // val.path.indexOf('@saulx/hub') !== -1) && val.path.indexOf('react-native') === -1 && val.path.indexOf('reactNative') === -1)
                  // ) {
                  // for (const key in store.resolvedToPath) {
                  //   const index = store.resolvedToPath[key].indexOf(val.path)
                  //   if (index !== -1) {
                  //     console.log(
                  //       'FOUND IT',
                  //       key
                  //       // store.resolvedToPath[key],
                  //       // store.resolvedToPath[key].find(v => {
                  //       //   return !!store.files[v]
                  //       // }),
                  //       // !!store.files[key]
                  //     )
                  //     depFile = store.files[store.resolvedToPath[key][0]]

                  //     break
                  //   }
                  // }
                  // }

                  walk(depFile, val.parseDependencies[type], bundle, val.path)
                }
              })
            }
          }

          files.push(file)

          if (start) {
            bundle.dynamicBundles.forEach(val => {
              // console.log('go bundle', val.path)

              // const deps =
              //   bundle.store.files[val.path] &&
              //   bundle.store.files[val.path].browser &&
              //   bundle.store.files[val.path].browser.dependencies

              // console.log(deps && deps.map(v => v.modile))

              const newBundle = (bundle.bundles[val.path] = new Bundle(
                bundle,
                bundle.store.files[val.path].path,
                store,
                bundle.store.files[val.path].id,
                bundle.store.files[val.path]
              ))
              bundleMap[val.path] = newBundle
              const traversedInBundle = isTraversed(bundle, val.path, store)
              if (traversedInBundle) {
                newBundle.requiredInBundle = traversedInBundle
              }
              walk(
                store.files[val.path],
                val.parseDependencies[type],
                newBundle
              )
            })
          }
        } else if (bundle.parent && traversedInBundle !== bundle) {
          refs[path] = traversedInBundle
        }
      } else {
        console.error('CANNOT FIND FILE', from)
      }
    }

    const bundle = new Bundle(false, file.path, store, file.id, file)

    walk(file, true, bundle)

    // console.log(Object.keys(refs))

    bundle.isRoot = true

    await generateCode({ bundle, refs, bundleMap, type })

    return bundle
  }
}

exports.createBundle = createBundle
