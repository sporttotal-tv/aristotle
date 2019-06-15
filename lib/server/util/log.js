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

const fill = (str, len) => {
  if (len < 1) {
    len = 1
  }
  return new Array(len).join(str)
}

const logError = (content, err, file, browser) => {
  if (err && err.message.indexOf('no such file or directory') !== -1) {
    err.message = 'No such file or directory'
  }

  var line
  if (typeof content === 'object') {
    line = [content.line, content.column || content.col]
    content = content.source
  } else {
    const m = err.message.match(/\((.*?)\)/)
    if (!m) {
      console.log(chalk.red(`\n${err.message} ${file.path}`))
      return ''
    }
    line = m[1].split(':')
  }
  console.log(
    chalk.red(
      `\n${err.message} in ${(err && err.path) || file.path}:${line.join(':')}`
    )
  )
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
