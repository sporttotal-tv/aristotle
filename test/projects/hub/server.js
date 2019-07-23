// import { createClient } from '@saulx/hub'

const fs = require('fs')

// console.log('ssr go go go', createClient)

export default async (req, files, ua) => {
  console.log(req.url, ua)
  return 'flurkenstrut ------- x'
}
