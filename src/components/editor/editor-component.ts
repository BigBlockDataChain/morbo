import * as html from '@hyperapp/html'

import Empty from '@components/widgets/empty'
import {loadNote, writeNote} from '@lib/io'
import {
  El,
  GraphNodeId,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import './mirror-mark'
import mirrorMark from './mirror-mark'

import './editor-component.css'

const saveSvg = require('../../res/save-disk.svg')
const deleteSvg = require('../../res/cancel.svg')
const editSvg = require('../../res/edit.svg')
const maximizeSvg = require('../../res/maximize.svg')

const SVG_ICONS = {
  SAVE: saveSvg,
  DELETE: deleteSvg,
  EDIT: editSvg,
  MAXIMIZE: maximizeSvg,
}

interface IEditorState {
  node: null | IGraphNodeData,
  handWritingEditor: any,
  textEditor: any,
}

export const state: IEditorState = {
  node: null,
  handWritingEditor: {},
  textEditor: {
    data: null,
    mirrorMarkEditor: null,
    parentTextArea : null,
  },
}

export const actions = {
  setNodeTitle: (title: string) => (_state: any) => {
    return {
      node: {
        ..._state.node,
        title,
      },
    }
  },

  handWritingEditor: {
  },

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

  saveTextNote: (nodeId: GraphNodeId) => async (_state: any, _actions: any) => {
    const data = _state.textEditor.data
    await writeNote(nodeId, NoteDataType.TEXT, data)
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
  onEditorUpdateMetadata: (node: IGraphNodeData) => void,
) {
  if (_state.node === null || node.id !== _state.node.id) {
    // Save previous open note
    if (_state.node !== null) {
      _actions.saveTextNote(_state.node.id)
    }

    _actions.setNode({...node})
    _actions.textEditor.setData(null)
    _actions.loadTextNote(node.id)
  }

  return html.div(
    {id: 'editor-container'},
    [
      ...headerButtons(_state, _actions, onClose, onEditorUpdateMetadata),
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
      ),
    ],
  )
}

function headerButtons(
  _state: any,
  _actions: any,
  onClose: () => any,
  onEditorUpdateMetadata: (node: IGraphNodeData) => void,
) {
  return [
    html.div(
      {class: 'container'},
      [
        html.button(
          {
            id: 'editor-close',
            onclick: (ev: Event) => {
              _actions.saveTextNote(_state.node.id),
              onClose()
            },
          },
          'x',
        ),
        html.button(
          {
            id: 'editor-save',
            onclick: () => {
              _actions.saveTextNote(_state.node.id)
              onEditorUpdateMetadata(_state.node)
            },
          },
          'save',
        ),
        html.div(
          { id: 'editor-right-buttons' },
          [
            icon(SVG_ICONS.SAVE),
            icon(SVG_ICONS.DELETE),
            icon(SVG_ICONS.EDIT),
            icon(SVG_ICONS.MAXIMIZE),
          ],
        ),
      ],
    ),
    html.input(
      {
        id: 'editor-title',
        oninput: (ev: Event) =>
          _actions.setNodeTitle((ev.target as HTMLInputElement).value),
        value: _state.node !== null ? _state.node.title : '',
      },
    ),
    html.div(
      {id: 'editor-tags'},
      [
        html.div(
          [
            _state.node !== null
              ? _state.node.tags.map(html.span)
              : Empty(),
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

function icon(imgSrc: string) {
  return html.div(
    {
      class: 'icon',
    },
    [
      html.img(
        {
          src: imgSrc,
        },
      ),
    ],
  )
}
