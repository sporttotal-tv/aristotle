import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  Fragment,
  useReducer
} from 'react'
import './react-native.css'
import parseProps from './props'

const defaultKeyExtractor = (item, index) => {
  return String(index)
}

const updateIndex = (s, a) => {
  return s + a
}

const isNode = typeof window === 'undefined'

let timer

const SectionList = props => {
  const p = useMemo(() => parseProps(props, 'v _s'), [
    props.className,
    props.style
  ])

  // const [scrollTopStored, setScrollTop] = useReducer(updateIndex, 0)
  // const [sectionIndex, setSectionIndex] = useReducer(updateIndex, 0)
  // const [childIndex, setChildIndex] = useReducer(updateIndex, 0)
  // const [height, setHeight] = useState(isNode ? 1500 : 0)
  const [amount, setAmount] = useReducer(updateIndex, 3)
  const ref = useRef()
  const [initial, setInitial] = useState(true)
  // const [contentHeight, setContentHeight] = useReducer(updateIndex, 0)
  const keyExtractor = props.keyExtractor || defaultKeyExtractor

  // console.log(ref)

  const children = []

  // if (height) {
  const sections = props.sections
  const renderSectionHeader = props.renderSectionHeader
  const stickySectionHeadersEnabled = props.stickySectionHeadersEnabled
  const renderItem = props.renderItem
  // let amountIncr = 1
  let currentAmount = 0

  // const stamp = childIndex + '-' + amount + '-' + sectionIndex

  let si = 0
  // console.log(currentAmount, '????', amount)
  while (currentAmount < amount && si < sections.length) {
    const section = sections[si]
    const data = section.data

    let len = Math.min(amount - currentAmount, data.length)

    // console.log()
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
      children.push(
        <div key={keyExtractor(item, i + '-' + si)}>
          {renderItem({
            item,
            section,
            index: i
          })}
        </div>
      )
      // children

      currentAmount++
    }

    if (currentAmount < amount) {
      si++
    }
  }

  // children

  const calcIt = (scrollTop = 0, target) => {
    if (!target) {
      target = ref.current
    }
    // console.log('ok recalc!')
    const { height } = target.getBoundingClientRect()
    const firstChild = target.firstChild
    const { height: firstChildHeight } = firstChild.getBoundingClientRect()
    // setContentHeight(firstChildHeight)
    // setHeight(height)

    // console.log(
    //   '----------------',
    //   height,
    //   height + scrollTop,
    //   scrollTop,
    //   firstChildHeight
    // )
    if (firstChildHeight < height * 1.5 + scrollTop) {
      // console.log('ADD IT')
      setAmount(5)
      // setScrollTop(scrollTop)
    }
  }

  useEffect(calcIt, [amount])

  // }

  //

  // const sticky = props.stickySectionHeadersEnabled
  // ListFooterComponent
  // renderItem
  // renderSectionHeader
  // renderSectionFooter
  // keyExtractor

  // console.log('xxxxxxxxxxxxxxxxxxxx')
  // if (!p.style) {
  //   p.style = {}
  // }

  // p.overflowY = 'scroll'
  // p.overflowX = 'hidden'
  // p.height = '100%'

  return (
    <div
      ref={ref}
      style={p.style}
      className={p.className}
      onScroll={useCallback(e => {
        if (!timer) {
          const target = ref.current
          // console.log(target)
          timer = setTimeout(() => {
            // setInitial(false)
            timer = false
            calcIt(target.scrollTop, target)
          }, 32)
        }
        // if (e.target.scro)
      })}
    >
      <div className="v">{children}</div>
    </div>
  )
}

/*

  start of virtualize

 this.props.onScroll({
          nativeEvent: {
            contentOffset: {
              y: target.scrollTop,
              x: target.scrollLeft
            }
          }
        })

         global.requestAnimationFrame(() => {
       
        this.ticking = false
      })
*/

export default SectionList
