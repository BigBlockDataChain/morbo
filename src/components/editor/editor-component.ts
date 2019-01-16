import * as html from '@hyperapp/html'

import Empty from '@components/widgets/empty'
import {getLogger} from '@lib/logger'
import {loadNote, writeNote} from '@lib/io'
import {
  El,
  GraphNodeId,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import './mirror-mark'
import MirrorMark from './mirror-mark'

import './editor-component.css'

const logger = getLogger('editor')

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
    mirrorMarkEditor: null,
  },
}

export const actions = {
  onEditorHostElementCreate: (el: El) => (_state: any) => {
    const mirrorMarkOptions = {
      showToolbar: true,
    }
    const mirrorMarkEditor = MirrorMark(el, mirrorMarkOptions)
    mirrorMarkEditor.render()

    return {
      textEditor: {
        ...state.textEditor,
        mirrorMarkEditor,
      },
    }
  },

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
  },

  loadTextNote: (nodeId: GraphNodeId) => async (_state: any) => {
    let data = ''
    try {
      data = await loadNote(nodeId, NoteDataType.TEXT)
    } catch (err) {
      logger.warn('Failed to load file for node ${nodeId}', err)
    }
    // TODO: This making an assumption that mirrorMarkEditor has been initialized. This
    // may not hold.
    _state.textEditor.mirrorMarkEditor.setValue(data)
  },

  saveTextNote: (nodeId: GraphNodeId) => async (_state: any, _actions: any) => {
    const data = _state.textEditor.mirrorMarkEditor.getValue()
    await writeNote(nodeId, NoteDataType.TEXT, data)
  },

  setNode: (node: IGraphNodeData) => (_: any, _actions: any) => {
    _actions.loadTextNote(node.id)
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
    if (_state.node !== null) _actions.saveTextNote(_state.node.id)

    // TODO: Find better approach. This _may_ fail if the editor still hasn't been created
    // yet
    // NOTE: Defer to ensure a mirror mark editor has been created
    setTimeout(() => _actions.setNode({...node}))
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
              oncreate: (el: El) => _actions.onEditorHostElementCreate(el),
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
            html.button({disabled: true}, '+'),
          ],
        ),
      ],
    ),
  ]
}

function icon(imgSrc: string) {
  return html.div(
    {class: 'icon'},
    [
      html.img({src: imgSrc}),
    ],
  )
}
