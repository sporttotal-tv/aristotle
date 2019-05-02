import React from 'react'
import { View, Text, SectionList } from 'react-native'

// refreshing={refreshing}
// onEndReached={updateRange}
// onEndReachedThreshold
// stickySectionHeadersEnabled

const renderSectionHeader = props => {
  const {
    section: {}
  } = props

  return <Text>HEADER</Text>
}

const sections = []

for (let i = 0; i < 10; i++) {
  const obj = {
    data: []
  }
  sections.push(obj)
  for (let i = 0; i < 10; i++) {
    obj.data.push({
      text: Array.from(Array(~~(Math.random() * 1e3))).map(
        () => ~~(Math.random() * 1e4) + ' '
      )
    })
  }
}

// check if section list gets updated (resize recalc size)
// render method for ssr (using dimensions)

export default () => {
  return (
    <View
      style={{
        height: '100%'
      }}
    >
      <Text>HELLO GO GO GO</Text>
      <View
        style={{
          height: '80%'
        }}
      >
        <SectionList
          style={{ transform: [{ translateY: 5 }], border: '10px solid red' }}
          onEndReachedThreshold={0.2}
          stickySectionHeadersEnabled
          ListFooterComponent={() => {
            return <Text>FOOTER</Text>
          }}
          renderSectionFooter={({ section }) => {
            return <Text>SECTION FOOTER</Text>
          }}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => index}
          renderItem={({ item, index, section }) => {
            return (
              <View
                style={{
                  marginTop: 15,
                  borderBottom: '1px solid blue'
                }}
              >
                <Text>{item.text}</Text>
              </View>
            )
          }}
          sections={sections}
        />
      </View>
    </View>
  )
}
