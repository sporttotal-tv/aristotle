const parseProps = (props, className) => {
  const p = {}

  if (props['data-file']) {
    p['data-file'] = props['data-file']
  }

  if (props.style) {
    if (Array.isArray(props.style)) {
      if (props.style.length === 2 && !props.style[1]) {
        p.style = props.style[0]
      } else {
        p.style = Object.assign({}, ...props.style)
      }
    } else {
      p.style = props.style
    }

    if (props.style.transform) {
      const str = []
      props.style.transform.forEach(val => {
        if (val.perspective) {
          props.style.perspective = val.perspective
        } else {
          for (let key in val) {
            let propValue = val[key]
            if (typeof propValue === 'number' && !/rotate|scale/.test(key)) {
              propValue += 'px'
            }
            str.push(`${key}(${propValue})`)
          }
        }
      })
      p.style.transform = str.join(' ')
    }
  }
  if (props.className) {
    p.className = className + ' ' + props.className
  } else {
    p.className = className
  }
  return p
}

export default parseProps
