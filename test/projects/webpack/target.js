'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports['default'] = addEventListener

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var _EventObject = require('./EventObject')

var _EventObject2 = _interopRequireDefault(_EventObject)

function addEventListener(target = {}, eventType, callback, option) {
  console.log('go go go go', _EventObject2)
}

module.exports = exports['default']
