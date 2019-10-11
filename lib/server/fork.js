console.log('-------------------------------')
console.log('Start SSR process')
let ssr, prevError
const fs = require('fs')

process.on('message', async msg => {
  let incoming
  try {
    const obj = (incoming = JSON.parse(msg))
    if (obj.code) {
      if (!ssr) {
        // eslint-disable-next-line
        ssr = eval(obj.code)
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
              message: prevError.message.replace(/Require stack[^@]+$/i, ''),
              stack: ''
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
      fs.writeFileSync('/Users/jim/Desktop/bla.js', incoming.code)
      console.log(err.stack)
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
