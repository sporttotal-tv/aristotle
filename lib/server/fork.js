const vm = require('vm')
console.log('-------------------------------')
console.log('Start SSR process')
const m = require('module')

let ssr, prevError
// const fs = require('fs')

process.on('message', async msg => {
  let incoming
  try {
    const obj = (incoming = JSON.parse(msg))
    if (obj.code) {
      if (!ssr) {
        // console.log(m.wrap(obj.code))
        ssr = vm.runInThisContext(m.wrap(obj.code + ';return global.ssr'), {
          filename: 'aristotle-vm.js'
        })(
          exports,
          require,
          module,
          __filename, // and correct filename
          __dirname // put correct dirname in there
        )
        // eslint-disable-next-line
        // ssr = eval(obj.code)
        process.send(
          JSON.stringify({
            type: 'init'
          })
        )
      } else {
        console.log('Allready have ssr in this child process...')
      }
    } else if (obj.type === 'request') {
      if (!ssr) {
        process.send(
          JSON.stringify({
            type: 'error',
            seq: incoming.seq,
            err: {
              message: prevError
                ? prevError.message.replace(/Require stack[^@]+$/i, '')
                : 'no ssr defined',
              stack: prevError ? prevError.stack : ''
            }
          })
        )
      } else {
        const payload = JSON.parse(obj.payload)
        const response = await ssr(payload.req, payload.files, payload.ua)
        // console.log(response)
        process.send(
          JSON.stringify({
            type: 'response',
            seq: obj.seq,
            response
          })
        )
      }
    }
  } catch (err) {
    if (!prevError) {
      prevError = err
    }

    if (incoming) {
      // posbile to write this to cache then execute it and give you the line #
      // fs.writeFileSync('/Users/jim/Desktop/bla.js', incoming.code)
      process.send(
        JSON.stringify({
          type: 'error',
          seq: incoming.seq,
          err: {
            message: err.message.replace(/Require stack[^@]+$/i, ''),
            stack: err.stack
          }
        })
      )
    } else {
      console.log('SSR ERROR', err.message.replace(/Require stack[^@]+$/i, ''))
    }
  }
})
