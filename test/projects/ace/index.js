import React from 'react'
import ReactDOM from 'react-dom'
import brace from 'brace'
import AceEditor from 'react-ace'

import 'brace/mode/java'
import 'brace/theme/github'

ReactDOM.render(
  <AceEditor
    mode="java"
    theme="github"
    onChange={() => {}}
    name="UNIQUE_ID_OF_DIV"
    editorProps={{ $blockScrolling: true }}
  />,
  document.getElementById('react-root')
)
