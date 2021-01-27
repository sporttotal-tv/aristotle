import WebSocket from 'ws'
import { File } from '@saulx/aristotle-types'
import { hash } from '@saulx/utils'

const genBrowser = (
  port: number
): string => `<script>(function connect (timeout) {
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
    })();</script>`

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

  return {
    update,
    // @ts-ignore
    browser: {
      checksum,
      path: 'livereload.ts',
      mime: 'text/javascript',
      gzip: false,
      url: '/' + checksum + '.js',
      contents: buf,
      text: browserScript
    }
  }
}

export default startWs
