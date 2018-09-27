const hash = require('string-hash')
const babylon = require('babylon')
const generate = require('babel-generator').default
const { dash } = require('./util')

const collectPropertiesAnim = (val, value, property, dynamicStyles) => {
  var hasDynamic = false
  const steps = []
  val.value.properties.forEach(val => {
    const name = val.key.name || val.key.value
    const innerValue = []
    val.value.properties.forEach(val => {
      const name = val.key.name || val.key.value
      if (
        val.value.type === 'NumericLiteral' ||
        val.value.type === 'StringLiteral' ||
        (val.value.type === 'UnaryExpression' && val.value.operator === '-')
      ) {
        const value =
          val.value.type === 'UnaryExpression'
            ? `-${val.value.argument.value}`
            : val.value.value

        innerValue.push(`${dash(name)}:${value};`)
      } else {
        hasDynamic = true
        innerValue.push(`${dash(name)}:$\{${generate(val.value).code}};`)
      }
    })
    steps.push(`${name}{${innerValue.join('')}}`)
  })

  const parsed = steps.join('')
  if (hasDynamic) {
    return parsed
  } else {
    value.push(parsed)
  }
}

// needs clean up lots of oppuritnuty for reuse
const parseAnimation = (
  dynamic,
  property,
  animation,
  name,
  newName,
  componentStyles,
  styles,
  properties,
  animationIndex,
  parsed,
  dynamicStyles
) => {
  properties.forEach(val => {
    const xname = val.key.name || val.key.value
    if (xname[0] === ':') {
      const props = val.value.properties
      for (let i = 0; i < props.length; i++) {
        const select = props[i]
        const sname = select.key.name || select.key.value
        if (
          !select.parsed &&
          (sname === 'animationName' || sname === 'animation')
        ) {
          if (
            select.value.type === 'NumericLiteral' ||
            select.value.type === 'StringLiteral'
          ) {
            if (select.value.value.indexOf(name) === 0) {
              if (dynamic) {
                const newName = `$\{__dynC(\`${dynamic}\`)}`
                select.value = babylon.parseExpression(
                  '`' + select.value.value.replace(name, newName) + '`'
                )
                select.parsed = true
              } else {
                select.value.value = select.value.value.replace(name, newName)
                select.parsed = true
              }
            }
          } else {
            const { code } = generate(select.value)
            var map = []
            parsed.forEach(val => {
              if (val.hasDynamic) {
                map.push(val.name + ':' + `__dynC(\`${val.hasDynamic}\`)`)
              } else {
                map.push(val.name + ':' + `'${val.hashed}'`)
              }
            })
            map = '{' + map.join(',') + '}'
            const genCode = `__dynA(${code}, ${map})`
            select.value = babylon.parseExpression(genCode)
            select.parsed = true
          }
        }
      }
    }
  })

  if (
    animation &&
    (!animation.parsed || animation.parsed.indexOf(name) === -1)
  ) {
    if (
      animation.value.type === 'NumericLiteral' ||
      animation.value.type === 'StringLiteral'
    ) {
      const val = animation.value.value
      if (val === name || val.indexOf(name + ' ') !== -1) {
        if (dynamic) {
          const newName = `$\{__dynC(\`${dynamic}\`)}`
          animation.value = babylon.parseExpression(
            '`' + val.replace(name, newName) + '`'
          )
          if (animation.parsed) {
            animation.parsed.push(name)
          } else {
            animation.parsed = [name]
          }
        } else {
          animation.value.value = val.replace(name, newName)
          // simpleStyle(animation, componentStyles, styles, properties, true)
          // properties.splice(animationIndex, 1)
          if (animation.parsed) {
            animation.parsed.push(name)
          } else {
            animation.parsed = [name]
          }
        }
      }
    } else {
      const { code } = generate(animation.value)
      var map = []
      parsed.forEach(val => {
        if (val.hasDynamic) {
          map.push(val.name + ':' + `__dynC(\`${val.hasDynamic}\`)`)
        } else {
          map.push(val.name + ':' + `'${val.hashed}'`)
        }
      })
      map = '{' + map.join(',') + '}'
      const genCode = `__dynA(${code}, ${map})`
      animation.value = babylon.parseExpression(genCode)
      if (animation.parsed) {
        animation.parsed.push(name)
      } else {
        animation.parsed = [name]
      }
    }
  }
}

const animationStyle = (
  val,
  componentStyles,
  styles,
  dynamicStyles,
  properties
) => {
  if (val.key.value === '@keyframes' && val.value.type === 'ObjectExpression') {
    let animation, animationIndex
    for (let i = 0; i < properties.length; i++) {
      const val = properties[i]
      if (val.key.name === 'animation' || val.key.name === 'animationName') {
        animationIndex = i
        animation = val
        break
      }
    }

    const parsed = val.value.properties.map(nestedVal => {
      const name = nestedVal.key.name
      const property = '@keyframes:' + name
      let value = []
      let hashed
      const hasDynamic = collectPropertiesAnim(
        nestedVal,
        value,
        property,
        dynamicStyles
      )
      if (hasDynamic) {
        dynamicStyles.push('animation')
      } else if (value.length) {
        value = value.join('')
        hashed = 'a' + hash(value).toString(36)
        const css = `@keyframes ${hashed} {${value}}`
        styles.push({
          property,
          val: value,
          hash: hashed,
          css
        })
      }
      return { hasDynamic, hashed, property, name }
    })

    for (let i = 0; i < parsed.length; i++) {
      const { hasDynamic, property, hashed, name } = parsed[i]
      parseAnimation(
        hasDynamic,
        property,
        animation,
        name,
        hashed,
        componentStyles,
        styles,
        properties,
        animationIndex,
        parsed,
        dynamicStyles
      )
    }

    return true
  }
}

module.exports = animationStyle
