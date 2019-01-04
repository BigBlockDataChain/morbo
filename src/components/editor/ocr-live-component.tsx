import { h } from 'hyperapp'
import 'myscript/dist/myscript.min.css'

const MyScriptJS = require('myscript/dist/myscript.esm')

export interface IOCRState {
  editor?: null | HTMLDivElement,
}

export interface IOCRActions {
  setEditorRef: (e: HTMLDivElement) => void,
  removeEditorRef: (e: HTMLDivElement) => void,
}

const editorStyle = {
  'minWidth': '500px',
  'minHeight': '500px',
};

export default function view (state: IOCRState, actions: IOCRActions) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '100vw',
        height: '100vh',
        background: 'white',
        zIndex: 9
      }}
    >
      <div
        style={editorStyle}
        oncreate={(e: HTMLDivElement) => actions.setEditorRef(e)} 
        onremove={(e: HTMLDivElement) => actions.removeEditorRef(e)}
      />
    </div>
    
  )
}
