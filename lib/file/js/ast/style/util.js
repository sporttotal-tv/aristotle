const dash = str => str.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)

const pushStyle = (value, css, hashed, property, componentStyles, styles) => {
  if (value.length > 0) {
    value = value.join('')
    styles.push({
      property,
      val: value,
      hash: hashed,
      css
    })
    componentStyles.push(hashed)
  }
}

exports.pushStyle = pushStyle

exports.dash = dash
