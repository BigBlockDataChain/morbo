import * as html from '@hyperapp/html'

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
) {
  if (node !== _state.node) {
    if (_state.node !== null) {
      _actions.saveTextNote(_state.node.id)
    }

    _actions.setNode(node)
    _actions.textEditor.setData(null)
    _actions.loadTextNote(node.id)
  }

  return html.div(
    {id: 'editor-container'},
    [
      ...headerButtons(node, _actions, onClose),
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

function headerButtons(node: IGraphNodeData, _actions: any, onClose: () => any) {
  return [
    html.div(
      {class: 'container'},
      [
        html.button(
          {
            id: 'editor-close',
            onclick: (ev: Event) => {
              _actions.saveTextNote(node.id),
              onClose()
            },
          },
          'x',
        ),
        html.button(
          {
            id: 'editor-save',
            onclick: () => {
              _actions.saveTextNote(node.id)
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
