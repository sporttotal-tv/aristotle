import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useReducer
} from 'react'
import './react-native.css'
import parseProps from './props'

const defaultKeyExtractor = (item, index) => String(index)

const updateIndex = (s, a) => {
  if (a === 0) {
    return 3
  }
  return s + a
}

const size = s => {
  var len = 0
  s.forEach(val => {
    len += 1
    // if
    if (val.data) {
      len += val.data.length
    }
  })
  return len
}

const SectionListInner = props => {
  const p = useMemo(() => parseProps(props, '_s'), [
    props.className,
    props.style
  ])

  let {
    sections,
    renderSectionHeader,
    stickySectionHeadersEnabled,
    renderSectionFooter,
    renderItem,
    ListFooterComponent,
    resizeStamp = 0,
    onEndReached
  } = props

  const [offset] = useState({})

  const [amount, setAmount] = useReducer(updateIndex, 3)

  const [initial, setInitial] = useReducer(updateIndex, 3)

  const ref = useRef()

  const keyExtractor = props.keyExtractor || defaultKeyExtractor
  const children = []

  let currentAmount = 0
  let si = 0
  let reachedEnd = false

  const onScroll = useCallback(e => {
    const target = ref.current
    if (!target.timer) {
      target.timer = global.requestAnimationFrame(() => {
        target.timer = global.requestAnimationFrame(() => {
          target.timer = false
          calculateAmount(target, true)
        })
      })
    }
  })

  const calculateAmount = (target, fromScroll) => {
    if (!target) {
      target = ref.current
    }
    const { height } = target.getBoundingClientRect()
    const firstChild = target.firstChild
    const scrollTop = (target && target.scrollTop) || 0
    const { height: firstChildHeight } = firstChild.getBoundingClientRect()

    if (
      (!offset.lastSet || offset.lastSet === offset.currentAmount) &&
      firstChildHeight < height * 1.5 + scrollTop
    ) {
      offset.lastSet = offset.currentAmount + 5
      setAmount(5)
      if (!fromScroll) {
        setInitial(5)
      }
    }

    return () => {
      if (target && target.timer) {
        global.cancelAnimationFrame(target.timer)
        target.timer = false
      }
    }
  }

  // opt size calc
  const len = sections ? size(sections) : 0
  if (offset.sections !== sections || (offset.len && offset.len !== len)) {
    offset.lastSet = 0
    const newSection = offset.sections !== sections
    if (newSection) {
      if (
        ref.current &&
        offset.sections &&
        sections &&
        ref.current.scrollTop !== 0
      ) {
        ref.current.scrollTop = 0
      }
      offset.currentAmount = 0
      offset.sections = sections
      offset.len = len
      setAmount(0)
      setInitial(0)
    } else {
      offset.len = len
      setInitial(0)
    }
  }

  while (currentAmount < amount && si < sections.length) {
    const section = sections[si]
    const data = section.data

    let len = Math.min(amount - currentAmount, data.length)

    if (si === sections.length - 1 && len === data.length) {
      reachedEnd = true
    }

    if (renderSectionHeader) {
      if (stickySectionHeadersEnabled) {
        children.push(
          <div
            style={{
              zIndex: 5,
              position: 'sticky',
              top: 0
            }}
            key={'sh' + si}
          >
            {renderSectionHeader({
              section,
              index: si
            })}
          </div>
        )
      } else {
        children.push(
          <div key={'sh' + si}>
            {renderSectionHeader({
              section,
              index: si
            })}
          </div>
        )
      }
    }

    for (let i = 0; i < len; i++) {
      const item = data[i]

      const child = renderItem({
        item,
        section,
        index: i
      })

      if (child) {
        children.push(<div key={keyExtractor(item, i + '-' + si)}>{child}</div>)
      }
      currentAmount++
    }

    if (currentAmount < amount) {
      si++
      if (renderSectionFooter) {
        children.push(
          <div key={'sf' + si}>
            {renderSectionFooter({
              section,
              index: si
            })}
          </div>
        )
      }
    }

    if (onEndReached && si === sections.length - 1 && len > data.length - 20) {
      onEndReached()
    }
  }

  offset.currentAmount = currentAmount
  offset.sections = sections
  offset.len = len

  if (reachedEnd) {
    if (ListFooterComponent) {
      children.push(<ListFooterComponent key="_footer" />)
    }
  }

  useEffect(() => {
    let target
    if (!target) {
      target = ref.current
    }
    if (!target.timer) {
      target.timer = global.requestAnimationFrame(() => {
        calculateAmount()
        target.timer = false
      })
    }
  }, [resizeStamp, initial])

  return (
    <div ref={ref} style={p.style} className={p.className} onScroll={onScroll}>
      <div className="v">{children}</div>
    </div>
  )
}

var cnt = 0

const SectionListWithResizeListener = props => {
  const [resizeStamp, setStamp] = useState(0)
  useEffect(() => {
    var timer

    const resize = () => {
      if (!timer) {
        timer = global.requestAnimationFrame(() => {
          timer = false
          // number does not matter just to force an update
          setStamp(++cnt)
        })
      }
    }

    global.addEventListener('resize', resize)
    return () => {
      global.removeEventListener('resize', resize)
    }
  }, [])

  return <SectionListInner {...props} resizeStamp={resizeStamp} />
}

const SectionList =
  typeof window === 'undefined'
    ? SectionListInner
    : SectionListWithResizeListener

export default SectionList
