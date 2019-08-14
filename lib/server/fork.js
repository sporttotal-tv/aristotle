console.log('Initializing ssr code ...')

// const { NodeVM } = require('vm2')

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
      // const copyGlobal = {
      //   require,
      //   process,
      //   Buffer,
      //   global,
      //   console,
      //   __dirname
      // }

      // // this is wrong! __dirname
      // for (let key in global) {
      //   copyGlobal[key] = global[key]
      // }

      // const context = NodeVM.createContext(copyGlobal)

      try {
        // vm.runInContext(data.slice(0, -indicator.length), context)

        // eslint-disable-next-line
        eval(data.slice(0, -indicator.length))
        console.log('Initialized ssr code successfully ✓')
      } catch (err) {
        process.stderr.write(
          JSON.stringify({
            fatal: true,
            err: err.message
          })
        )
      }

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
          console.log('here?')
          // fiddle with stack
          process.stderr.write(
            JSON.stringify({
              seq: args.seq,
              err: err.message
            })
          )
        }
      } catch (err) {
        // use error object
        process.stderr.write(
          'cannot parse arguments send to child process' + data
        )
      }
      data = ''
    }
  }
})

process.stdin.on('end', () => {
  console.log('end')
})
