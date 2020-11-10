const vm = require('vm')
console.log('-------------------------------')
console.log('Start SSR process')
const m = require('module')
const { join } = require('path')

let ssr, prevError
// const fs = require('fs')

process.on('message', async msg => {
  let incoming
  try {
    const obj = (incoming = JSON.parse(msg))
    if (obj.code) {
      let wrappedRequire = require

      if (!ssr) {
        // creates requireContexts for node - nessecary for linked depos
        if (obj.requireContext) {
          wrappedRequire = v => {
            let r, pErr
            try {
              r = require(v)
            } catch (err) {
              pErr = err
              if (obj.requireContext[v]) {
                try {
                  r = require(join(obj.requireContext[v], v))
                } catch (err) {}
              }
              if (!r) {
                for (const key in obj.requireContext) {
                  try {
                    r = require(join(obj.requireContext[key], v))
                    break
                  } catch (err) {}
                }
              }
            }
            if (r === undefined) {
              throw pErr
            }

            return r
          }
        }

        ssr = vm.runInThisContext(m.wrap(obj.code + ';return global.ssr'), {
          filename: 'aristotle-vm.js'
        })(
          exports,
          wrappedRequire,
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

        const render = ssr.render || ssr

        const response = await render(payload.req, payload.files, payload.ua)
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
