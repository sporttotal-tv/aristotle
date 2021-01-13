import WebSocket from 'ws'
import { File } from './types'
import { hash } from '@saulx/utils'

const genBrowser = (port: number): string => `(function connect (timeout) {
    var host = window.location.hostname
    if (!timeout) timeout = 0
    setTimeout(function () {
        var socket = new WebSocket('ws://' + host + ':${port}')
        socket.addEventListener('message', function () {
        location.reload()
        })
        socket.addEventListener('open', function () {
        if (timeout > 0) location.reload()
        console.log('🛸 aristotle live reload server connected')
        })
        socket.addEventListener('close', function () {
        console.log('🛸 aristotle live reload server reconnecting...')
        connect(Math.min(timeout + 1000), 3000)
        })
    }, timeout)
    })();`

type LiveReload = {
  browser: File
  update: () => void
}

const startWs = (port: number): LiveReload => {
  const { clients } = new WebSocket.Server({ port })
  const update = () => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('')
      }
    })
  }

  // file for live reload?
  const browserScript = genBrowser(port)

  const checksum = hash(browserScript).toString(16)

  return {
    update,
    browser: {
      checksum,
      path: 'livereload.ts',
      compressed: false,
      mime: 'text/javascript',
      gzip: false,
      url: '/' + checksum + '.js',
      contents: Buffer.from(browserScript),
      text: browserScript
    }
  }
}

export default startWs
