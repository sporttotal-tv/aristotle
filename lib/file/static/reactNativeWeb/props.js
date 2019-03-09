const getRect = node => {
  // Unlike the DOM's getBoundingClientRect, React Native layout measurements
  // for "height" and "width" ignore scale transforms.
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
  const { x, y, top, left } = node.getBoundingClientRect(node)
  const width = node.offsetWidth
  const height = node.offsetHeight
  return { x, y, width, height, top, left }
}

class ReactNativeComponent {
  constructor(e) {
    this.domElement = e
  }
  measure(callback) {
    const node = this.domElement
    const relativeNode = node && node.parentNode
    if (node && relativeNode) {
      // rnative allways uses a timeout
      setTimeout(() => {
        // think if we rly need the relative rect...
        const relativeRect = getRect(relativeNode)
        const { height, left, top, width } = getRect(node)
        const x = left - relativeRect.left
        const y = top - relativeRect.top
        callback(x, y, width, height, left, top)
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

  // if (props.onLayout) {
  //   {nativeEvent: { layout: {x, y, width, height}}}
  //   // add listener as well...
  //   p.ref = e => {
  //     const { width, height , x, y} = e.getBoundingClientRectangle()
  //     // progressBar.measure((a, b, width, height, px, py)
  //   }
  // }

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
