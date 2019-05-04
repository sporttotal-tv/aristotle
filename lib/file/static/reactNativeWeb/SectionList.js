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

const updateIndex = (s, a) => s + a

const offsetReducer = (s, a) => {
  if (a) {
    return Object.assign({}, s, a)
  } else {
    return Object.assign({}, s)
  }
}

const loopToSelectFirst = (children, offset, amount) => {
  const len = children.length
  for (let i = offset.realIndex; i < len; i++) {
    const child = children[i]
    let index = child.getAttribute('data-index')
    if (index !== null) {
      const childRect = child.getBoundingClientRect()
      if (childRect.top + childRect.height > amount) {
        offset.realIndex = 0
        offset.index = index
        if (index === 0) {
          offset.height = 0
        } else {
          offset.height = childRect.top * -1 - offset.height
        }
        return true
      }
    }
  }
}

const selectStartIndex = (offset, children, scrollTop, height) => {
  const child = children[offset.realIndex]
  let changed = false
  if (offset.realIndex > children.length) {
    return
  }
  if (child) {
    let index = child.getAttribute('data-index')
    if (index === null) {
      offset.realIndex++
      return selectStartIndex(offset, children, scrollTop, height)
    } else {
      index = index * 1
      if (offset.index !== index) {
        changed = true
        offset.index = index
      }

      let delta = scrollTop - offset.top
      if (offset.switchedHeight) {
        delta = 0
        offset.switchedHeight = false
      }

      // console.log(delta)

      // const
      const rect = child.getBoundingClientRect()

      if (delta < 0) {
        if (rect.top + rect.height > -height) {
          offset.realIndex = 0
          offset.index = offset.index - 60
          offset.height = 0
          if (offset.index < 0) {
            offset.index = 0
          }
          offset.switchedHeight = true
          changed = true
        }

        // and reset the bottom
      } else if (delta > 0) {
        if (rect.top + rect.height < -height) {
          changed = loopToSelectFirst(children, offset, -height * 0.5)
          if (changed) {
            offset.switchedHeight = true
          }
        }
      }

      offset.top = scrollTop
      return changed
    }
  } else {
    offset.realIndex++
    return selectStartIndex(offset, children, scrollTop, height)
  }
}

const selectChildOffset = (offset, firstChild, scrollTop, height) => {
  const children = firstChild.children
  const startIndexChanged = selectStartIndex(
    offset,
    children,
    scrollTop,
    height
  )
  if (startIndexChanged) {
    return true
  }
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

  const [offset, updateOffset] = useReducer(offsetReducer, {
    height: 0,
    index: 0,
    endIndex: 0,
    realIndex: 0,
    realEndIndex: 0,
    top: 0
  })

  const [amount, setAmount] = useReducer(updateIndex, 3)
  const ref = useRef()
  const keyExtractor = props.keyExtractor || defaultKeyExtractor
  const children = []

  let currentAmount = 0
  let si = 0
  let reachedEnd = false

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
      if (
        currentAmount >= offset.index &&
        (!offset.endIndex || currentAmount <= offset.endIndex)
      ) {
        const child = renderItem({
          item,
          section,
          index: i
        })

        if (child) {
          children.push(
            <div
              // data-index={currentAmount}
              key={keyExtractor(item, i + '-' + si)}
            >
              {child}
            </div>
          )
        }
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
      // -10 arbitrary number to give it a bit off
      onEndReached()
    }
  }

  // offset.amount = amount

  if (offset.sections !== sections) {
    offset.lastSet = 0
  }

  offset.currentAmount = currentAmount
  offset.sections = sections

  if (reachedEnd) {
    if (ListFooterComponent) {
      children.push(<ListFooterComponent key="_footer" />)
    }
  }

  const calculateAmount = target => {
    if (!target) {
      target = ref.current
    }
    const { height } = target.getBoundingClientRect()
    const firstChild = target.firstChild
    const scrollTop = (target && target.scrollTop) || 0
    const { height: firstChildHeight } = firstChild.getBoundingClientRect()

    // console.log(offset.lastSet, offset.currentAmount)

    if (
      (!offset.lastSet || offset.lastSet === offset.currentAmount) &&
      firstChildHeight < height * 1.5 + scrollTop
    ) {
      // check if total increased
      // store last amount and last current amount on offset
      offset.lastSet = offset.currentAmount + 5
      setAmount(5)
    }

    // do this later and better
    // if (selectChildOffset(offset, firstChild, scrollTop, height)) {
    //   updateOffset()
    // }

    return () => {
      if (target && target.timer) {
        global.cancelAnimationFrame(target.timer)
        target.timer = false
      }
    }
  }

  useEffect(calculateAmount, [amount, resizeStamp])

  return (
    <div
      ref={ref}
      style={p.style}
      className={p.className}
      onScroll={useCallback(e => {
        const target = ref.current
        if (!target.timer) {
          target.timer = global.requestAnimationFrame(() => {
            target.timer = false
            calculateAmount(target)
          })
        }
      })}
    >
      <div className="v">
        <div
          style={{
            width: '100%',
            height: offset.height
          }}
        />
        {children}
      </div>
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
