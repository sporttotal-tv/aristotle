console.log('-------------------------------')
console.log('Start SSR process')
let ssr

process.on('message', async msg => {
  try {
    const obj = JSON.parse(msg)
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
        console.log('allready have ssr in this child process...')
      }
    } else if (obj.type === 'request') {
      const payload = JSON.parse(obj.payload)
      const response = await ssr(payload.req, payload.files, payload.ua)
      process.send(
        JSON.stringify({
          type: 'response',
          seq: obj.seq,
          response
        })
      )
    }
  } catch (err) {
    console.log('SSR ERROR', err.message.replace(/Require stack[^@]+$/i, ''))
  }
})
