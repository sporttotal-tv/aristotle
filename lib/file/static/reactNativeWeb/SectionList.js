import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  Fragment,
  useReducer
} from 'react'
import './react-native.css'
import parseProps from './props'
import refWrapper from './refWrapper'

// hooks?

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

const defaultKeyExtractor = (item, index) => {
  return 'c' + index
}

export default SectionList
