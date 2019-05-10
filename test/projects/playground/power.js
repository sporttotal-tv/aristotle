// shared functions
import datas from './datas'

const updateChildByIndex = (index, value, elem) => {
  const t = typeof value

  if (
    (t === 'string' || t === 'number') &&
    elem.childNodes[index].nodeType === 3
  ) {
    elem.childNodes[index].nodeValue = value
  }
  // allways creates placeholders
}

const updateChild = (value, elem) => {
  // value relates to all children
  if (elem.children) {
    const t = typeof value
    if (t === 'string' || t === 'number') {
      elem.appendChild(document.createTextNode(value))
    }
  }
}

// ----------------
// compiler info
// ----------------
const Corner = {
  elem: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
}
Corner.elem.style.fill = 'red'
Corner.elem.style.width = '20px'
Corner.elem.style.height = '20px'
Corner.elem.setAttribute('viewBox', '0 0 20 20')
const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
circle.setAttribute('cx', 10)
circle.setAttribute('cy', 10)
circle.setAttribute('r', 10)
Corner.elem.appendChild(circle)
// ----------------
// compiler info
// const TitleProps = [{ field: 'title', prop: 0 }, { field: 'fontSize', prop: 1 }]
// ----------------
const Title = {
  elem: document.createElement('h1'),
  props: [
    (fontSize, elem) => {
      elem.style.fontSize = fontSize
    },
    (title, elem) => {
      updateChildByIndex(0, title, elem)
    }
  ]
}

// if passed as children goes for a div else if tries for a text node by default
// when Text goes for text node by default as well
Title.elem.appendChild(document.createTextNode(''))
Title.elem.appendChild(Corner.elem.cloneNode(true))

// ----------------
// compiler info
// const ItemProps = [
//   {
//     field: 'item',
//     props: [{ field: 'title', prop: 0 }, { field: 'description', prop: 1 }]
//   }
// ]
// ----------------
const Item = {
  elem: document.createElement('div'),
  props: [
    (title, elem) => {
      Title.props[1](title, elem.children[0])
    },
    (description, elem) => {
      updateChildByIndex(1, description, elem)
    }
  ]
}

Item.elem.appendChild(Title.elem.cloneNode(true))
Item.elem.appendChild(document.createTextNode(''))

// ----------------
// compiler info
// const List = [
//   {
//     field: 'data',
//     props: 0
//   }
// ]
// ----------------
const List = {
  elem: document.createElement('div'),
  props: [
    (data, elem, state, updateState) => {
      // diff data
      //   Title.props[0](title, elem.children[0]);
      // we need to diff... :(
      //   if (!state) {
      //       state = []
      //   }
      data.forEach(data => {
        const child = Item.elem.cloneNode(true)
        Item.props[0](data.title, child)
        Item.props[1](data.description, child)
        elem.appendChild(child)
      })
    }
  ]
}

// everywhere where props convert into children it does diffing
// either by a switch statement or mapping of array

// ----------------
const holder = document.createElement('div')
document.body.appendChild(holder)

// ----------------
var d = Date.now()
const list = List.elem.cloneNode(true)
List.props[0](datas[0], list)
holder.appendChild(list)
console.error('Power', Date.now() - d, 'ms', datas[0].length)
