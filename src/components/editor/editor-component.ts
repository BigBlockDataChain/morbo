import * as html from '@hyperapp/html'
import {Subject, Subscription} from 'rxjs'
import {debounceTime} from 'rxjs/operators'

import {loadNote, writeNote} from '@lib/io'
import {getLogger} from '@lib/logger'
import {
  El,
  GraphNodeId,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import * as HandwritingEditor from './handwriting/handwriting-editor-component'
import './mirror-mark'
import MirrorMark from './mirror-mark'

import './editor-component.css'

const logger = getLogger('editor')

const closeSvg = require('../../res/cancel.svg')
const deleteSvg = require('../../res/garbage.svg')
const needSaveSvg = require('../../res/save-solid.svg')

const SVG_ICONS = {
  NEEDSAVE: needSaveSvg,
  CLOSE: closeSvg,
  DELETE: deleteSvg,
}

const SAVE_DEBOUNCE_DELAY = 2500
const saveDebounceSubject = new Subject<void>()

interface IEditorState {
  node: null | IGraphNodeData,
  tagsInputValue: string,
  lastSave: null | Date,
  textEditor: {
    editor: null | any,
    saveDebounceSub: null | Subscription,
  },
  handwritingEditor: {
    editor: null | any,
    component: any,
  },
}

export const state: IEditorState = {
  node: null,
  tagsInputValue: '',
  lastSave: null,
  textEditor: {
    editor: null,
    saveDebounceSub: null,
  },
  handwritingEditor: {
    editor: null,
    component: HandwritingEditor.componentState,
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

  // Reset state
  onDestroy: () => ({...state}),

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

  setNode: (node: IGraphNodeData) => (_state: any, _actions: any) => {
    if (_state.textEditor.editor && node.type === NoteDataType.TEXT) {
      _state.textEditor.editor.setValue('')
      _actions.textEditor.loadNote({editor: _state.textEditor.editor, nodeId: node.id})
    } else if (
      _state.handwritingEditor.editor
      && node.type === NoteDataType.HANDWRITING
    ) {
      // noop
    }

    return {
      tagsInputValue: node.tags.toString(),
      lastSave: null,
      node,
    }
  },

  setNodeType: (
    {type, updateMetadata}:
      {type: NoteDataType, updateMetadata: (node: IGraphNodeData) => any},
  ) =>
    (_state: any) => {
      const node = {
        ..._state.node,
        type,
      }
      updateMetadata(node)
      return {
        node,
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

  saveTextNote: () => async (_state: any, _actions: any) => {
    const data = _state.textEditor.editor.getValue()
    await writeNote(_state.node.id, NoteDataType.TEXT, data)
    _actions.updateLastSaveTime()
    _state.node.lastModified = new Date()
  },

  saveHandwritingNote: () => async (_state: any, _actions: any) => {
    _actions.handwritingEditor.component.getImage(async (data: any) => {
      await writeNote(_state.node.id, NoteDataType.HANDWRITING, data)
      _actions.updateLastSaveTime()
      _state.node.lastModified = new Date()
    })
  },

  updateLastSaveTime: () => ({
    lastSave: new Date(),
  }),

  textEditor: {
    onCreate: (
      {el, nodeId, saveData}:
        {el: El, nodeId: GraphNodeId, saveData: () => any},
    ) =>
      (_: any, _actions: any) => {
        logger.debug('Create text editor')

        const mirrorMarkOptions = {
          showToolbar: true,
        }
        const editor = MirrorMark(el, mirrorMarkOptions)
        editor.render()

        const saveDebounceSub = saveDebounceSubject
          .pipe(
            debounceTime(SAVE_DEBOUNCE_DELAY),
          )
          .subscribe(() => saveData())

        // Load note asynchronously
        _actions.loadNote({editor, nodeId})

        return {
          editor,
          saveDebounceSub,
        }
      },

    onDestroy: () => (_state: any) => {
      logger.debug('Destroy text editor')
      _state.saveDebounceSub.unsubscribe()
      return {
        editor: null,
        saveDebounceSub: null,
      }
    },

    loadNote: ({editor, nodeId}: {editor: any, nodeId: GraphNodeId}) => () => {
      logger.debug('Loading text file for node', nodeId)

      loadNote(nodeId, NoteDataType.TEXT)
        .then((data: string) => {
          editor.setValue(data)
        })
        .catch((err: any) => {
          logger.warn(`Failed to load file for text note ${nodeId}`, err)
        })
    },
  },

  handwritingEditor: {
    component: HandwritingEditor.componentActions,

    onCreate: (
      {el, nodeId, saveData}:
        {el: El, nodeId: GraphNodeId, saveData: () => any},
    ) =>
      (_: any, _actions: any) => {
        logger.debug('Create handwriting editor', nodeId)

        const saveDebounceSub = saveDebounceSubject
          .pipe(
            debounceTime(SAVE_DEBOUNCE_DELAY),
          )
          .subscribe(() => saveData())

        // Load note asynchronously
        _actions.loadNote({nodeId})

        return {
          saveDebounceSub,
        }
      },

    onDestroy: () => (_state: any) => {
      logger.debug('Destroy handwriting editor')
      _state.saveDebounceSub.unsubscribe()
      return {
        editor: null,
        saveDebounceSub: null,
      }
    },

    loadNote: ({nodeId}: {nodeId: GraphNodeId}) => (_: any, _actions: any) => {
      logger.debug('Loading handwriting file for node', nodeId)

      loadNote(nodeId, NoteDataType.HANDWRITING)
        .then((data: any) => _actions.component.setImage(data))
        .catch((err: any) => {
          logger.warn(`Failed to load file for handwriting note ${nodeId}`, err)
        })
    },
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
  if (_state.node === null || _state.node.id !== node.id) {
    _actions.setNode({...node})
  }

  // NOTE: For some unknown reason, using a div makes the oncreate not work for this top
  // level element. So instead the span is being used instead.
  return html.span(
    {
      id: 'editor-container',
      oncreate: (el: El) => _actions.onCreate({el, updateMetadata}),
      ondestroy: () => _actions.onDestroy(),
      onkeydown: (ev: KeyboardEvent) => ev.stopPropagation(),
    },
    [
      headerButtons(
        _state,
        _actions,
        () => {
          if (_state.node.type === NoteDataType.TEXT)
            _actions.saveTextNote()
          else
            _actions.saveHandwritingNote()

          onClose()
          updateMetadata(_state.node)
        },
        updateMetadata,
        deleteNode,
      ),
      html.div(
        {
          id: 'editor',
          onclick: (ev: Event) => {
            if ((ev.target as El).tagName !== 'A') {
              return
            }
            ev.preventDefault()
            const link = (ev.target as El).getAttribute('href')
            if (link !== null) {
              const noteId = link.match(/^note:(\d+)$/)
              if (noteId !== null) {
                _state.textEditor.editor.previewButton.click()
                selectNode(parseInt(noteId[1], 10))
              }
            }
          },
          onkeydown: () => saveDebounceSubject.next(),
        },
        [
          _state.node && _state.node.type === undefined
            ? html.div(
              {
                key: 'type-selector',
                class: 'editor-element-wrapper',
              },
              [
                selectTypeDialog(
                  (type: NoteDataType) => _actions.setNodeType({type, updateMetadata}),
                ),
              ],
            )

          : _state.node && _state.node.type === NoteDataType.TEXT
            ? html.div(
              {class: 'editor-element-wrapper'},
              [
                html.textarea({
                  key: 'text-editor',
                  id: 'text-editor',
                  oncreate: (el: El) =>
                    _actions.textEditor.onCreate({
                      el,
                      nodeId: _state.node.id,
                      saveData: () => _actions.saveTextNote(),
                    }),
                  ondestroy: (...args: any[]) =>
                    _actions.textEditor.onDestroy(),
                }),
              ],
            )

          : _state.node && _state.node.type === NoteDataType.HANDWRITING
            ? html.div(
              {
                key: 'handwriting-editor-container',
                id: 'handwriting-editor-container',
                class: 'editor-element-wrapper',
                oncreate: (el: El) => _actions.handwritingEditor.onCreate({
                  el,
                  nodeId: _state.node.id,
                  saveData: () => _actions.saveHandwritingNote(),
                }),
                ondestroy: () => _actions.handwritingEditor.onDestroy(),
              },
              [
                HandwritingEditor.view(
                  _state.handwritingEditor.component,
                  _actions.handwritingEditor.component,
                  _state.node.id,
                  saveDebounceSubject,
                ),
              ],
            )

          : html.div('null') as any,
        ],
      ),
    ],
  )
}

function selectTypeDialog(setType: (type: NoteDataType) => any) {
  return html.div(
    {
      id: 'type-selector-dialog',
    },
    [
      html.button({onclick: () => setType(NoteDataType.TEXT)}, 'Text'),
      html.button({onclick: () => setType(NoteDataType.HANDWRITING)}, 'Handwriting'),
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
  const row1 = html.div(
    {class: 'row'},
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
        {id: 'header-buttons'},
        [
          icon(SVG_ICONS.DELETE, () => {
            deleteNode(_state.node.id)
            onClose()
          }),
          icon(SVG_ICONS.CLOSE, onClose),
        ],
      ),
    ],
  )

  const row2 = html.div(
    {class: 'row'},
    [
      html.div(
        {id: 'editor-tags'},
        [
          html.label('Tags: '),
          html.input(
            {
              value: _state.tagsInputValue,
              oninput: (ev: Event) => {
                _actions.setNodeTags((ev.target as HTMLInputElement).value)
              },
              onfocusout: (ev: Event) => {
                updateMetadata(_state.node)
              },
            },
          ),
        ],
      ),
      html.div(
        {id: 'last-save'},
        [
          _state.lastSave !== null ? html.span('Last save:') : null as any,
          _state.lastSave !== null
            ? html.span(_state.lastSave.toLocaleString())
            : null as any,
        ],
      ),
    ],
  )

  return html.div(
    {id: 'header'},
    [
      row1,
      row2,
    ],
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
