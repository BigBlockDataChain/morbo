import * as html from '@hyperapp/html'

import {loadNote, writeNote} from '@lib/io'
import {getLogger} from '@lib/logger'
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
const closeSvg = require('../../res/cancel.svg')
const deleteSvg = require('../../res/garbage.svg')
const needSaveSvg = require('../../res/save-solid.svg')

const SVG_ICONS = {
  SAVE: saveSvg,
  NEEDSAVE: needSaveSvg,
  CLOSE: closeSvg,
  DELETE: deleteSvg,
}

interface IEditorState {
  node: null | IGraphNodeData,
  tagsInputValue: string,
  handWritingEditor: any,
  textEditor: any,
  saveIcon: any,
  originalData: any,
}

export const state: IEditorState = {
  node: null,
  tagsInputValue: '',
  handWritingEditor: {},
  textEditor: {
    mirrorMarkEditor: null,
  },
  saveIcon: saveSvg,
  originalData: '',
}

export const actions = {
  onCreate: (
    {el, updateMetadata}: {el: El, updateMetadata: (node: IGraphNodeData) => void},
  ) =>
    (_state: any, _actions: any) => {
      el.addEventListener(
        'keydown',
        (ev: KeyboardEvent) => _actions.handleKeyboardShortcut({ev, updateMetadata}),
      )
    },

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

  setNodeTags: (tags: string) => (_state: any) => {
    return {
      tagsInputValue: tags,
      node: {
        ..._state.node,
        tags: tags.split(',').map((p: string) => p.trim()),
      },
    }
  },

  handWritingEditor: {
  },

  textEditor: {
  },

  loadTextNote: (nodeId: GraphNodeId) => async (_state: any, _actions: any) => {
    let data = ''
    try {
      data = await loadNote(nodeId, NoteDataType.TEXT)
    } catch (err) {
      logger.warn('Failed to load file for node ${nodeId}', err)
    }
    // TODO: This making an assumption that mirrorMarkEditor has been initialized. This
    // may not hold.
    _state.textEditor.mirrorMarkEditor.setValue(data)
    _actions.setOriginalData(data)
  },

  setOriginalData: (data: any) => (_state: any, _actions: any) => {
    const codeMirrorEditor = _state.textEditor.mirrorMarkEditor.cm
    codeMirrorEditor.on('keyup', () => {
      _actions.updateSaveIcon(codeMirrorEditor.getValue() !== data)
    })
    return{
      originalData: data,
    }
  },

  saveTextNote: () => async (_state: any, _actions: any) => {
    const data = _state.textEditor.mirrorMarkEditor.getValue()
    await writeNote(_state.node.id, NoteDataType.TEXT, data)
  },

  setNode: (node: IGraphNodeData) => (_: any, _actions: any) => {
    _actions.loadTextNote(node.id)
    return {
      tagsInputValue: node.tags.toString(),
      node,
    }
  },

  updateSaveIcon: (isEdited: boolean) => (_state: any) => {
    return {
      saveIcon: isEdited ? needSaveSvg : saveSvg,
    }
  },

  handleKeyboardShortcut: (
    {ev, updateMetadata}:
      {ev: KeyboardEvent, updateMetadata: (node: IGraphNodeData) => void},
  ) => (_state: any, _actions: any) => {
      if (!(ev.ctrlKey && ev.key === 's'))
        return

      logger.debug('Saving editor data')
      updateMetadata(_state.node)
      _actions.saveTextNote()
    },
}

export function view(
  _state: any,
  _actions: any,
  node: IGraphNodeData,
  onClose: () => any,
  updateMetadata: (node: IGraphNodeData) => void,
  deleteNode: (nodeId: GraphNodeId) => void,
  selectNode: (nodeId: GraphNodeId) => void,
) {
  if (_state.node === null || node.id !== _state.node.id) {
    // Save previous open note
    if (_state.node !== null) _actions.saveTextNote()

    // TODO: Find better approach. This _may_ fail if the editor still hasn't been created
    // yet
    // NOTE: Defer to ensure a mirror mark editor has been created
    setTimeout(() => _actions.setNode({...node}))
  }

  // NOTE: For some unknown reason, using a div makes the oncreate not work for this top
  // level element. So instead the span is being used instead.
  return html.span(
    {
      id: 'editor-container',
      oncreate: (el: El) => _actions.onCreate({el, updateMetadata}),
      onreference: (ev: CustomEvent) => selectNode(ev.detail),
    },
    [
      ...headerButtons(_state, _actions, onClose, updateMetadata, deleteNode),
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
  updateMetadata: (node: IGraphNodeData) => void,
  deleteNode: (nodeId: GraphNodeId) => void,
) {
  return [
    html.div(
      {class: 'container'},
      [
        html.input(
          {
            id: 'editor-title',
            oninput: (ev: Event) => {
              _actions.setNodeTitle((ev.target as HTMLInputElement).value)
            },
            onfocusout: (ev: Event) => {
              updateMetadata(_state.node)
            },
            value: _state.node !== null ? _state.node.title : '',
          },
        ),
        html.div(
          { id: 'editor-right-buttons' },
          [
            icon(SVG_ICONS.DELETE, () => {
              deleteNode(_state.node.id)
              onClose()
            }),
            icon(_state.saveIcon, () => {
              _actions.saveTextNote()
              updateMetadata(_state.node)
              _actions.updateSaveIcon(false)
            }),
            icon(SVG_ICONS.CLOSE, onClose),
          ],
        ),
      ],
    ),
    html.input(
      {
        id: 'editor-tags',
        value: _state.tagsInputValue,
        oninput: (ev: Event) => {
          _actions.setNodeTags((ev.target as HTMLInputElement).value)
        },
        onfocusout: (ev: Event) => {
          updateMetadata(_state.node)
        },
      },
    ),
  ]
}

function icon(imgSrc: string, onClick: () => void) {
  return html.div(
    {
      class: 'icon',
      onclick: () => onClick(),
    },
    [
      html.img({src: imgSrc}),
    ],
  )
}
