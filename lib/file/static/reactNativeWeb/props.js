class ReactNativeComponent {
  constructor(e) {
    this.domElement = e
  }
  focus() {
    this.domElement.focus()
  }
  blur() {
    this.domElement.blur()
  }
  measure(callback) {
    const node = this.domElement
    const relativeNode = node && node.parentNode
    if (node && relativeNode) {
      // rnative always uses a timeout
      setTimeout(() => {
        // think if we rly need the relative rect...
        const relRect = relativeNode.getBoundingClientRect()
        const rect = node.getBoundingClientRect()
        const x = rect.left - relRect.left
        const y = rect.top - relRect.top
        // custom top
        let top = 0
        let n = node
        while (n) {
          top += n.offsetTop
          n = n.offsetParent
        }
        callback(x, y, rect.width, rect.height, rect.left, top)
      }, 0)
    }
  }
}

const parseProps = (props, className) => {
  const p = {}

  // ref times
  if (props.forwardRef) {
    p.ref = e => {
      if (e) {
        if (typeof props.forwardRef === 'object') {
          props.forwardRef.current = new ReactNativeComponent(e)
        } else {
          props.forwardRef(new ReactNativeComponent(e))
        }
      }
    }
  }

  if (props['data-file']) {
    p['data-file'] = props['data-file']
  }

  if (props.id) {
    p.id = props.id
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
      if (Array.isArray(props.style.transform)) {
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
  }
  if (props.className) {
    p.className = className + ' ' + props.className
  } else {
    p.className = className
  }

  const pointerEvents = props.pointerEvents
  if (pointerEvents) {
    if (!p.className) {
      p.className = ''
    }
    if (pointerEvents === 'none') {
      p.className += ' _z'
    } else if (pointerEvents === 'box-only') {
      p.className += ' _x'
    } else if (pointerEvents === 'box-none') {
      p.className += ' _y'
    }
    delete p.pointerEvents
  }

  return p
}

export default parseProps
