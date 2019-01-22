import OcrEditor, {
  ocrActions,
  IOcrEditorState,
  ocrState
} from '@components/editor/ocr/ocr-editor-component'
import HandwritingEditor, {
  handwritingActions,
  IHandwritingEditorState,
  handwritingState
} from '@components/editor/handwriting/handwriting-editor-component'
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
import Empty from '../widgets/empty'

import './editor-component.css'

const logger = getLogger('editor')

const saveSvg = require('../../res/save-disk.svg')
const closeSvg = require('../../res/cancel.svg')
const deleteSvg = require('../../res/garbage.svg')

const SVG_ICONS = {
  SAVE: saveSvg,
  CLOSE: closeSvg,
  DELETE: deleteSvg,
}

interface IEditorState {
  node: null | IGraphNodeData,
  tagsInputValue: string,
  ocrEditor: IOcrEditorState,
  handwritingEditor: IHandwritingEditorState,
  textEditor: any,
}

export const state: IEditorState = {
  node: null,
  tagsInputValue: '',
  ocrEditor: ocrState as IOcrEditorState,
  handwritingEditor: handwritingState as IHandwritingEditorState,
  textEditor: {
    mirrorMarkEditor: null,
  },
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

  ocrEditor: ocrActions,
  handwritingEditor: handwritingActions,

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

  saveTextNote: () => async (_state: any, _actions: any) => {
    const data = _state.textEditor.mirrorMarkEditor.getValue()
    await writeNote(_state.node.id, NoteDataType.TEXT, data)
  },

  loadHandwritingNote: (noteId: GraphNodeId) => async (_state: any, _actions: any) => {
    const image = await loadNote(noteId, NoteDataType.HANDWRITING)
    _actions.handwritingEditor.setImage(image)
  },

  setNode: (node: IGraphNodeData) => (_: any, _actions: any) => {
    _actions.loadTextNote(node.id)
    return {
      tagsInputValue: node.tags.toString(),
      node,
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
    },
    [
      ...headerButtons(_state, _actions, node.type, onClose, updateMetadata, deleteNode),
      html.div(
        {id: 'editor'},
        [
          /* Note: The following conditional editor rendering could be simplified, but is
          intentionally left as-is to avoid bugs that appear when it is simplified */

          /* Text Editor */
          (node.type !== NoteDataType.HANDWRITING) ? (
            html.textarea(
            {
              id: 'text-editor',
              oncreate: (el: El) => _actions.onEditorHostElementCreate(el),
            },
            )
          ) : html.span(),

          /* Handwriting Editor */
          (node.type !== NoteDataType.HANDWRITING) ? html.span() : (
            handwritingEditor(_state, _actions, node, onClose)
          ),

          /* Pop-up OCR Editor -- only rendered when the popup is open */
          (_state.ocrEditor.isOpen)
            ? OcrEditor(
              _state.ocrEditor,
              _actions.ocrEditor,
              _state.textEditor.mirrorMarkEditor
            )
            : html.span(), /* Empty() prevents the execution of the oncreate lifecycle method for some reason */
        ],
      ),
    ],
  )
}

function headerButtons(
  _state: any,
  _actions: any,
  noteType: NoteDataType,
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
            oninput: (ev: Event) =>
              _actions.setNodeTitle((ev.target as HTMLInputElement).value),
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
            icon(SVG_ICONS.SAVE, () => {
              _actions.saveTextNote()
              updateMetadata(_state.node)
            }),
            icon(SVG_ICONS.CLOSE, onClose),
            /* TODO: find a good svg icon to represent the OCR button. */
            noteType !== NoteDataType.HANDWRITING ? html.button(
              {
                onclick: _actions.ocrEditor.open,
                disabled: false,
              },
              'ocr',
            ) : Empty(),
          ],
        ),
      ],
    ),
    html.input(
      {
        id: 'editor-tags',
        value: _state.tagsInputValue,
        oninput: (ev: Event) =>
          _actions.setNodeTags((ev.target as HTMLInputElement).value),
      },
    ),
  ]
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
