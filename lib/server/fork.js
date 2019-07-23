console.log('Initializing ssr code ...')

const vm = require('vm')

// console.log('Initialized ssr code successfully ✓')
process.stdin.setEncoding('utf8')
let data = ''
let code

process.stdin.on('readable', async () => {
  let chunk
  // Use a loop to make sure we read all available data.
  while ((chunk = process.stdin.read()) !== null) {
    data += chunk
  }

  if (!code) {
    let indicator = '_____________ENDCODE_____________'
    if (/_____________ENDCODE_____________$/.test(data)) {
      const copyGlobal = {
        require,
        process,
        Buffer,
        global,
        console,
        __dirname
      }

      // this is wrong! __dirname
      for (let key in global) {
        copyGlobal[key] = global[key]
      }

      const context = vm.createContext(copyGlobal)

      vm.runInContext(data.slice(0, -indicator.length), context)

      console.log('Initialized ssr code successfully ✓')
      data = ''

      code = true
    }
  } else {
    // '__$$$END__'
    const endIndicator = '__$$$END__'
    const startIndicator = '__$$$START__'
    // __$$$END__
    if (/__\$\$\$END__$/.test(data)) {
      data = data.slice(0, -endIndicator.length)
      try {
        const args = JSON.parse(data)
        try {
          const r = await global.ssr(...args.args)

          process.stdout.write(
            startIndicator +
              JSON.stringify({
                seq: args.seq,
                content: r
              }) +
              endIndicator
          )
        } catch (err) {
          // fiddle with stack
          process.stderr.write(
            JSON.stringify({
              seq: args.seq,
              error: err
            })
          )
        }
      } catch (err) {
        // use error object
        process.stderr.write('cannot parse arguments send to child process')
      }
      data = ''
    }
  }
})

process.stdin.on('end', () => {
  console.log('end')
})
