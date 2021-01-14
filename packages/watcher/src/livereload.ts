import WebSocket from 'ws'
import { File } from '@saulx/aristotle-build'
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
        console.log('%cAristotle live reload server connected', 'color: #bbb');
        })
        socket.addEventListener('close', function () {
        console.log('%cAristotle live reload server reconnecting...', 'color: #bbb');
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

  const buf = Buffer.from(browserScript)

  const uint8 = new Uint8Array(buf)

  for (let i = 0; i < buf.byteLength; ++i) {
    uint8[i] = buf[i]
  }

  return {
    update,
    browser: {
      checksum,
      unint8: uint8,
      path: 'livereload.ts',
      compressed: false,
      mime: 'text/javascript',
      gzip: false,
      url: '/' + checksum + '.js',
      contents: buf,
      text: browserScript
    }
  }
}

export default startWs
