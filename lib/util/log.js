// make fallback for browser for chalk
const chalk = require('chalk')

const showcode = (str, start, end) => {
  // eslint-disable-line
  if (typeof start === 'object') {
    if (start.end) {
      showcode(str, start.start, start.end)
    } else if (Array.isArray(start)) {
      for (let i in start) {
        showcode(str, start[i].start, start[i].end)
      }
    }
  } else {
    console.log(
      chalk.blue(str.slice(start - 50 > 0 ? start - 50 : 0, start)) +
        chalk.green(str.slice(start, end)) +
        chalk.blue(
          str.slice(end, end + 50 > str.length ? str.length : end + 50)
        )
    )
  }
}

const parseJSONError = (raw, err) => {
  var line = err.message.match(/position (\d+)$/)
  if (line) {
    let index = line[1] * 1 + 1
    err.message += parseCharIndex(raw, index)
  }
}

const fill = (str, len) => new Array(len).join(str)

const logError = (content, err, file, browser) => {
  var line
  if (typeof content === 'object') {
    line = [content.line, content.column || content.col]
    content = content.source
  } else {
    const m = err.message.match(/\((.*?)\)/)
    if (!m) {
      console.log(chalk.red(`\n${err.message} ${file}`))
      return ''
    }
    line = m[1].split(':')
  }
  console.log(chalk.red(`\n${err.message} in ${file}`))
  const nr = 1 * line[0]
  const char = 1 * line[1]
  const lines = content.toString().split('\n')
  lines.forEach((val, i) => {
    if (i > nr - 10 && i < nr + 10) {
      var linenr = i + ' '
      linenr = chalk.white(fill(' ', 5 - linenr.length) + linenr)
      if (i === nr - 1) {
        console.log(` ${linenr} ${chalk.red(val)}`)
        console.log(` ${fill(' ', char - 1 + 7)}${chalk.red('^')}`)
      } else {
        console.log(` ${linenr} ${val}`)
      }
    }
  })
  console.log('\n')
}

function logErrorBrowser(errors, error, init) {
  var elem = document.createElement('div')
  document.body.style.background = '#000'
  document.body.style.padding = '20px'
  function print(html) {
    const d = document.createElement('div')
    d.innerHTML = html
    d.style.fontFamily = 'andale mono'
    d.style.fontSize = '12px'
    d.style.color = '#ab84ff'
    elem.appendChild(d)
  }

  function fill(str, len) {
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
  if (error) {
    print('<div style="font-weight:bold;">Server side error</div>')

    print(
      '<div style="color:#ff5b5b;margin-top:20px;margin-bottom:20px;font-weight:bold;">"' +
        error.message +
        '"</div>'
    )

    var stack = error.stack.split('\n').slice(0, init ? -5 : -4)

    for (var i = 0; i < stack.length; i++) {
      print('<div style="font-size:11px;color:#aaa;">' + stack[i] + '</div>')
    }
  } else {
    for (var key in errors) {
      error = errors[key].error
      var content = errors[key].contents
      print(
        '<div style="color:#ff5b5b;margin-top:20;margin-bottom:20;">' +
          error +
          ' in ' +
          key +
          '</div>'
      )
      // console.log(chalk.red(`\n${err.message} in ${file}`))
      var m = error.match(/\((.*?)\)/)
      if (!m) continue

      var line = m[1].split(':')
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
              '<span style="color:#ff5b5b;">' +
              inner +
              '</span>' +
              '\u00A0' +
              '<span style="color:#ff5b5b;"><pre style="display:inline-block;margin:0;padding:0;font-family:andale mono;">' +
              htmlEncode(val) +
              '</pre></span>'
            print(linenr)

            print(
              fill(' ', char - 1 + 7) +
                '<span style="color:#ff5b5b;">' +
                '^' +
                '</span>'
            )
          } else {
            linenr += '<span style="color:#333;">' + inner + '</span>'
            linenr +=
              '\u00A0<pre style="display:inline-block;margin:0;padding:0;font-family:andale mono;">' +
              htmlEncode(val) +
              '</pre>'
            print(linenr)
          }
        }
      })
    }
  }
  document.body.appendChild(elem)
}

const parseCharIndex = (str, index, end) => {
  if (!end) end = index + 1
  let cnt = 0
  const lines = str.split('\n')
  for (let i = 0; i < lines.length; i++) {
    cnt += lines[i].length + 1
    if (index <= cnt) {
      return ` (${i + 1}:${Math.max(cnt - index, 0)})`
    }
  }
}

exports.logError = logError
exports.fill = fill
exports.showcode = showcode
exports.parseCharIndex = parseCharIndex
exports.parseJSONError = parseJSONError
exports.logErrorBrowser = logErrorBrowser
