import OcrEditor, {
  actions as ocrEditorActions,
  IOcrEditorState,
  state as ocrEditorState
} from '@components/editor/ocr-editor-component'
import HandwritingEditor, {
  actions as handwritingEditorActions,
  IHandwritingEditorState,
  state as handwritingEditorState
} from '@components/editor/handwriting-editor-component'
import * as html from '@hyperapp/html'
import Empty from '@components/widgets/empty'
import {loadNote} from '@lib/io'
import {
  El,
  GraphNodeId,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import './mirror-mark'
import mirrorMark from './mirror-mark'

import './editor-component.css'

interface IEditorState {
  node: null | IGraphNodeData,
  ocrEditor: IOcrEditorState,
  handwritingEditor: IHandwritingEditorState,
  textEditor: any,
}

export const state: IEditorState = {
  node: null,
  ocrEditor: ocrEditorState as IOcrEditorState,
  handwritingEditor: handwritingEditorState as IHandwritingEditorState,
  textEditor: {
    data: null,
    mirrorMarkEditor: null,
    parentTextArea : null,
  },
}

export const actions = {
  ocrEditor: ocrEditorActions,
  handwritingEditor: handwritingEditorActions,

  textEditor: {
    setData: (data: string) => () => {
      return {data}
    },
    setMirrorMarkEditor: (mirrorMarkEditor: any) => () => {
      return {mirrorMarkEditor}
    },
    setParentTextArea: (parentTextArea: any) => () => {
      return {parentTextArea}
    },
  },

  loadTextNote: (nodeId: GraphNodeId) => async (_state: any, _actions: any) => {
    const data = await loadNote(nodeId, NoteDataType.TEXT)
    _actions.textEditor.setData(data)

    // Dispatch a custom event to update the default CodeMirror text.
    const updateEvent = new CustomEvent('textupdate', {
      detail: {data},
    })
    const parentTextArea = _state.textEditor.parentTextArea
    if (parentTextArea !== null) {
      parentTextArea.dispatchEvent(updateEvent)
    }
  },

  loadHandwritingNote: (noteId: GraphNodeId) => async (_state: any, _actions: any) => {
    const image = await loadNote(noteId, NoteDataType.HANDWRITING)
    _actions.handwritingEditor.setImage(image)
  },

  setNode: (node: IGraphNodeData) => () => {
    return {node}
  },
}

export function view(
  _state: any,
  _actions: any,
  node: IGraphNodeData,
  onClose: () => any,
) {
  if (node !== _state.node) {
    if (node.type === NoteDataType.TEXT) {
      _actions.setNode(node)
      _actions.textEditor.setData(null)
      _actions.loadTextNote(node.id)
    } else if (node.type == NoteDataType.HANDWRITING) {
      // Loading delayed until context is loaded
      // _actions.loadHandwritingNote(node.id)
    }
  }

  return html.div(
    {id: 'editor-container'},
    [
      ...headerButtons(_state, _actions, node, onClose),
      node.type === NoteDataType.TEXT ? textEditor(_state, _actions, node, onClose) : Empty(),
      node.type === NoteDataType.HANDWRITING ? handwritingEditor(_state, _actions, node, onClose) : Empty(),
      (_state.ocrEditor.isOpen)
        ? OcrEditor(
          _state.ocrEditor,
          _actions.ocrEditor,
        )
        : html.span(), /* Empty() prevents the oncreate lifecycle method execution */
    ],
  )
}

function textEditor(
  _state: any,
  _actions: any,
  node: IGraphNodeData,
  onClose: () => any,
) {
  return (
    html.div(
      {id: 'editor'},
      [
        html.textarea(
          {
            id: 'text-editor',
            oncreate: (el: El) => {
              const mirrorMarkOptions = {
                showToolbar: true,
              }
              const mirrorMarkEditor = mirrorMark(el, mirrorMarkOptions)
              mirrorMarkEditor.render()
              _actions.textEditor.setParentTextArea(el)
              _actions.textEditor.setMirrorMarkEditor(mirrorMarkEditor)

              // Get the CodeMirror (editor) object.
              const codeMirrorEditor = mirrorMarkEditor.cm

              // Set the onChange event to capture input data.
              codeMirrorEditor.on('change', () => {
                el.dispatchEvent(new Event('input'))
              })
            },
            oninput: () => {
              const codeMirrorEditor = _state.textEditor.mirrorMarkEditor.cm
              _actions.textEditor.setData(codeMirrorEditor.getValue())
            },
            ontextupdate: (ev: CustomEvent) => {
              const codeMirrorEditor = _state.textEditor.mirrorMarkEditor.cm
              codeMirrorEditor.setValue(ev.detail.data)
            },
          },
        ),
      ],
    )
  )
}

function handwritingEditor(
  _state: any,
  _actions: any,
  node: IGraphNodeData,
  onClose: () => any,
) {
  return (
    html.div(
      {
        id: 'handwriting-editor',
        oncreate: () => {_actions.loadHandwritingNote(node.id)},
      },
      [
        HandwritingEditor(_state.handwritingEditor, _actions.handwritingEditor, node.id),
      ],
    )
  )
}

function headerButtons(
  _state: any,
  _actions: any,
  node: IGraphNodeData,
  onClose: () => any,
) {
  return [
    html.button(
      {
        id: 'editor-close',
        onclick: (ev: Event) => onClose(),
      },
      'x',
    ),
    html.button(
      {disabled: true},
      'save',
    ),
    html.button(
      {
        onclick: _actions.ocrEditor.open,
        disabled: false,
      },
      'ocr',
    ),
    html.div(
      {id: 'editor-right-buttons'},
      [
        html.button(
          {disabled: true},
          'delete',
        ),
        html.button(
          {disabled: true},
          'edit',
        ),
        html.button(
          {disabled: true},
          'maximize',
        ),
      ],
    ),
    html.div(
      {id: 'editor-title'},
      node.title,
    ),
    html.div(
      {id: 'editor-tags'},
      [
        html.div(
          [
            node.tags.map(html.span),
            html.button(
              {
                disabled: true,
              },
              '+',
            ),
          ],
        ),
      ],
    ),
  ]
}
