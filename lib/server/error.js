const { logError } = require('../util/log')

function logErrorBrowser(errors, error, init, code) {
  var elem = document.createElement('div')
  document.body.style.background = '#000'
  document.body.style.padding = '20px'

  function print(html) {
    const d = document.createElement('div')
    d.innerHTML = html
    d.style.fontFamily = 'andale mono'
    d.style.fontSize = '12px'
    d.style.color = '#ab84ff'
    d.style.userSelect = 'all'
    elem.appendChild(d)
  }

  function fill(str, len) {
    // console.log(len)
    if (len < 1) {
      len = 1
    }
    if (str === ' ') {
      str = '\u00A0'
    }
    return new Array(len).join(str)
  }

  function htmlEncode(value) {
    var div = document.createElement('div')
    var text = document.createTextNode(value)
    div.appendChild(text)
    return div.innerHTML
  }

  function diplayError(line, content) {
    print('<div style="user-select:text;height: 20px;"></div>')
    var nr = 1 * line[0]
    var char = 1 * line[1]
    var lines = content.toString().split('\n')
    lines.forEach((val, i) => {
      var linenr = ''
      if (i > nr - 10 && i < nr + 10) {
        var inner = i + ' '
        inner += fill(' ', 5 - inner.length)
        if (i === nr - 1) {
          linenr +=
            '<span style="user-select:text;color:#ff5b5b;">' +
            inner +
            '</span>' +
            '\u00A0' +
            '<span style="user-select:text;color:#ff5b5b;"><pre style="user-select:text;display:inline-block;margin:0;padding:0;font-family:andale mono;">' +
            htmlEncode(val) +
            '</pre></span>'
          print(linenr)
          print(
            fill(' ', char - 1 + 7) +
              '<span style="user-select:text;color:#ff5b5b;">' +
              '^' +
              '</span>'
          )
        } else {
          linenr +=
            '<span style="user-select:text;color:#333;">' + inner + '</span>'
          linenr +=
            '\u00A0<pre style="user-select:text;display:inline-block;margin:0;padding:0;font-family:andale mono;">' +
            htmlEncode(val) +
            '</pre>'
          print(linenr)
        }
      }
    })
  }

  if (error) {
    if (error.notReady) {
      print(
        '<div style="font-weight:bold;flex-wrap:wrap;font-size:30px;width:100%;height:100vh;display:flex;justify-content:center;align-items:center;"><div>Launching dev server ⏳</div></div>'
      )
    } else {
      print('<div style="font-weight:bold;">Server side error</div>')

      if (error.path) {
        print(
          '<div style="user-select:text;color:#ff5b5b;margin-top:20px;margin-bottom:20px;font-weight:bold;">"' +
            error.message +
            ' in ' +
            error.path +
            '</div>'
        )
      } else {
        print(
          '<div style="user-select:text;color:#ff5b5b;margin-top:20px;margin-bottom:20px;font-weight:bold;">"' +
            error.message +
            '"</div>'
        )
      }

      // console.log(error.stack)
      var stack = error.stack.split('\n').slice(0, init ? -4 : -3)

      if (code && error.line) {
        diplayError(error.line, code)
      } else {
        for (var i = 0; i < stack.length; i++) {
          print(
            '<div style="user-select:text;font-size:11px;color:#aaa;">' +
              stack[i] +
              '</div>'
          )
        }
      }
    }
  } else if (errors) {
    for (var key in errors) {
      error = errors[key].error
      print(
        '<div style="user-select:text;color:#ff5b5b;margin-top:20;margin-bottom:20;">' +
          error +
          ' in ' +
          key +
          '</div>'
      )
      var content = errors[key].content

      var line

      if (typeof content === 'object') {
        line = [content.line, content.column || content.col]
        content = content.source
      } else {
        const m = error.match(/\((.*?)\)/)
        if (!m) {
          print(error)
          continue
        }
        line = m[1].split(':')
      }

      diplayError(line, content)
    }
  }
  document.body.appendChild(elem)
}

const reportError = (err, init, code, errors) => {
  const error = {
    message: err.message,
    stack: err.stack,
    notReady: err.notReady
  }
  // eslint-disable-next-line
  const codeString =
    code
      .replace(/\\/g, `\\\\`)
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${') + '`'
  let codeStringParsed

  if (codeString) {
    if (err.stack) {
      const isEval = err.stack.indexOf('aristotle-vm.js') !== -1
      if (isEval) {
        const m = err.stack.match(/(\d{1,10}:\d{1,10}\))/)
        const line = m[1].slice(0, -1).split(':')
        line[0] = line[0] * 1
        line[1] = line[1] * 1 - 1

        const lines = codeString.split('\n')
        for (let i = line[0]; i > 0; i--) {
          const m = lines[i].match(/^\/\/ ={1,50} (.*?) ={1,50}$/)
          if (m) {
            codeStringParsed = lines.slice(i).join('\n')
            // codeString.slice(codeString.indexOf(lines[i + 1]), -1) + '`'
            line[0] = line[0] - i
            error.line = line
            error.path = m[1].split(' ')[0]
            break
          }
        }
        logError(
          {
            line: line[0],
            column: line[1],
            source: codeStringParsed
          },
          error,
          { path: 'SSR' }
        )
      }
    }
  }

  var inline = ''
  if (errors) {
    const parsedErrors = {}
    for (let key in errors) {
      parsedErrors[key] = {
        error: errors[key].error.message || 'Unkown error',
        content: (errors[key].content && errors[key].content.node.raw) || ''
      }
    }
    inline += `var errors = ${JSON.stringify(parsedErrors)};\n`
  }
  if (err) {
    inline += `var error = ${JSON.stringify(error)};\n`
  }
  inline += logErrorBrowser.toString()
  inline += 'var code = `' + (codeStringParsed || codeString) + `;\n`
  inline += `;\nlogErrorBrowser(${errors ? 'errors' : false}, ${
    err ? 'error' : false
  }, ${init ? 'true' : 'false'}, code)`
  return inline
}

module.exports = reportError
