console.log('-------------------------------')
console.log('Start SSR process')
let ssr, files

process.on('message', async msg => {
  try {
    const obj = JSON.parse(msg)
    if (obj.code) {
      if (!ssr) {
        // eslint-disable-next-line
        ssr = eval(obj.code)
        files = obj.files
        process.send(
          JSON.stringify({
            type: 'init'
          })
        )
      } else {
        console.log('allready have ssr in this child process...')
      }
    } else if (obj.type === 'request') {
      let response = await ssr(obj.payload.request, files, obj.payload.ua)
      process.send(
        JSON.stringify({
          type: 'response',
          seq: obj.seq,
          response
        })
      )
    }
  } catch (err) {
    console.log('not valid json', err)
  }

  // will use files later
  // process.send('flapdrol')
})
