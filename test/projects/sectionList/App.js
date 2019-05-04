import React from 'react'
import { View, Text, SectionList } from 'react-native'

// refreshing={refreshing}
// onEndReached={updateRange}
// onEndReachedThreshold
// stickySectionHeadersEnabled

const renderSectionHeader = props => {
  const {
    index,
    section: {}
  } = props

  return (
    <View
      style={{
        width: '100%',
        padding: 10,
        color: 'white',
        backgroundColor: 'purple'
      }}
    >
      <Text>HEADER TIMES {index}</Text>{' '}
    </View>
  )
}

const sections = []

for (let i = 0; i < 10; i++) {
  const obj = {
    data: []
  }
  sections.push(obj)
  for (let i = 0; i < 1000; i++) {
    obj.data.push({
      text: Array.from(Array(~~(Math.random() * 100))).map((v, i) => i)
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
            return (
              <View
                style={{
                  width: '100%',
                  padding: 200,
                  backgroundColor: 'brown'
                }}
              >
                <Text>FOOTER</Text>{' '}
              </View>
            )
          }}
          renderSectionFooter={({ section }) => {
            return (
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'blue'
                }}
              >
                <Text>SECTION FOOTER</Text>{' '}
              </View>
            )
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
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap'
                  }}
                >
                  {item.text}
                </div>
              </View>
            )
          }}
          sections={sections}
        />
      </View>
    </View>
  )
}
