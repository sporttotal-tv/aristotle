import React, { Component } from 'react'
import './react-native.css'
import parseProps from './props'

const defaultKeyExtractor = (item, index) => String(index)

const size = s => {
  var len = 0
  s.forEach(val => {
    len += 1
    if (val.data) {
      len += val.data.length
    }
  })
  return len
}

class Item extends React.Component {
  shouldComponentUpdate(next) {
    const change = next.item !== this.props.item
    return change
  }
  render() {
    return <div>{this.props.children}</div>
  }
}

class SectionListComponent extends Component {
  state = {
    amount: 3
  }
  onScroll = e => {
    if (!this.timer) {
      this.timer = global.requestAnimationFrame(() => {
        this.timer = false
        this.calculateSize()
      })
    }
  }
  setRef = e => {
    if (e) {
      this.element = e
    }
  }
  calculateSize(initial) {
    if (!this.timer && typeof window !== 'undefined') {
      this.timer = global.requestAnimationFrame(() => {
        if (this.element) {
          this.timer = false
          const element = this.element
          let { height } = element.getBoundingClientRect()
          const firstChild = element.firstChild

          const scrollTop = (element && element.scrollTop) || 0
          let { height: firstChildHeight } = firstChild.getBoundingClientRect()

          if (
            this.props.ListFooterComponent &&
            firstChild.lastChild &&
            firstChild.lastChild.getAttribute('data-footer')
          ) {
            const h = firstChild.lastChild.getBoundingClientRect().height
            firstChildHeight -= h
          }
          if (
            (!this.lastSet || this.lastSet === this.currentAmount) &&
            firstChildHeight < height + 100 + scrollTop
          ) {
            const amount = this.state.amount + 12
            this.lastSet = amount
            this.setState({ amount })
          } else {
            if (initial) {
              this.calculatedInitial = true
            }
          }
        }
      })
    }
  }
  createChildren() {
    const children = []
    let {
      ListFooterComponent,
      sections,
      renderSectionHeader,
      stickySectionHeadersEnabled,
      renderSectionFooter,
      renderItem,
      onEndReached
    } = this.props
    const keyExtractor = this.props.keyExtractor || defaultKeyExtractor
    let reachedEnd
    let si = 0
    const { amount } = this.state
    this.currentAmount = 0
    while (this.currentAmount < amount && si < sections.length) {
      const section = sections[si]
      const data = section.data
      let len = Math.min(amount - this.currentAmount, data.length)
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
        // memoize this
        // keep previous child array
        const child = renderItem({
          item,
          section,
          index: i
        })
        // add shoud component update
        if (child) {
          children.push(
            <Item key={keyExtractor(item, i + '-' + si)} item={item}>
              {child}
            </Item>
          )
        }
        this.currentAmount++
      }
      if (this.currentAmount < amount) {
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
      if (
        onEndReached &&
        si === sections.length - 1 &&
        len > data.length - 20
      ) {
        // console.log('END')
        onEndReached()
      }
    }
    if (reachedEnd) {
      if (ListFooterComponent) {
        children.push(
          <div key="_footer" data-footer>
            <ListFooterComponent />
          </div>
        )
      }
    }
    return children
  }
  componentDidMount() {
    if (this.props.sections) {
      this.size = size(this.props.sections)
    }
    // resize listener and intial calc
  }
  componentWillUnmount() {
    global.cancelAnimationFrame(this.timer)
    // remove resize listener and timer
  }
  shouldComponentUpdate(next, state) {
    let changed = false
    let calcSize = size(next.sections)
    // console.log('SIZE:', calcSize)
    if (next.sections !== this.props.sections) {
      // more diff checks
      let samePage = false
      if (
        next.sections &&
        next.sections[0] &&
        this.props.sections &&
        this.props.sections[0] &&
        next.sections[0].id === this.props.sections[0].id
      ) {
        // console.log(next.sections[0].filterState)
        samePage = true

        // console.log(this.props.sections[0])

        if (next.sections[0].filterState) {
          if (next.sections[0].filterState[next.sections[0].id]) {
            samePage = false
          }
        }
        // if (next.sections.filterState)
      }

      // console.log('🧚🏻‍ Diffrent section', samePage)
      this.calculatedInitial = false
      changed = true
      this.lastSet = 0
      if (!samePage || next.sections.length === 1) {
        this.state.amount = 3
      }
    } else if (
      calcSize !== this.size &&
      this.currentAmount < this.state.amount
    ) {
      // console.log('🤱🏼 Changed length')
      changed = true
      this.lastSet = 0
      this.calculatedInitial = false
    } else if (this.state.amount !== state.amount) {
      // console.log('🧜‍  State update', state.amount, this.state.amount)
      changed = true
    }
    this.size = calcSize
    return changed
  }
  render() {
    // console.log('RENDER ARISTOTLE SECTION LIST')
    const p = parseProps(this.props, '_s')
    const children = this.createChildren()
    if (!this.calculatedInitial) {
      this.calculateSize(true)
    }
    return (
      <div
        ref={this.setRef}
        style={p.style}
        className={p.className}
        onScroll={this.onScroll}
      >
        <div className="v">{children}</div>
      </div>
    )
  }
}

export default SectionListComponent
