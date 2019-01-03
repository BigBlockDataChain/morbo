import * as html from '@hyperapp/html'
import {Subject} from 'rxjs'

import * as ContextMenu from '@components/context-menu/context-menu-component'
import Editor from '@components/editor/editor-component'
import GraphView from '@components/graph/graph-view-component'
import {
  FocusCommand,
  GraphAction,
  GraphCommand,
  ResetGraphCommand,
} from '@components/graph/types'
import * as Toolbar from '@components/toolbar/toolbar-component'
import Empty from '@components/widgets/empty'
import {loadNote} from '@lib/io'
import {getLogger} from '@lib/logger'
import search from '@lib/search'
import {
  El,
  GraphNodeId,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import {emptyFunction} from '@lib/utils'
import {actions as graphActions} from './actions/graph'

import './app.css'

const logger = getLogger('main')

const graphActionStream = new Subject<GraphAction>()
const graphCommandStream = new Subject<GraphCommand>()
const graphCommandObservable = graphCommandStream.asObservable()
const editorOpenChange = new Subject<void>()
const editorOpenChangeObservable = editorOpenChange.asObservable()

const EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY = 250

interface IRuntime {
  showEditor: boolean
  selectedNode: null | IGraphNodeData,
}

interface IState {
  graph: IGraphState
  editor: IEditorState
  settings: any
  runtime: IRuntime
  toolbar: any,
  contextMenu: any,
}

interface IEditorState {
  node: null | IGraphNodeData
  handWritingEditor: any
  textEditor: any
}

interface IGraphState {
  index: IGraphIndex
  metadata: IGraphMetadata
  height: number
  width: number
}

export const initialState: IState = {
  toolbar: Toolbar.state,
  contextMenu: ContextMenu.state,
  graph: {
    index: {},
    metadata: {},
    height: 0,
    width: 0,
  },
  editor: {
    node: null,
    handWritingEditor: {},
    textEditor: {
      data: null,
    },
  },
  settings: {},
  runtime: {
    showEditor: true,
    selectedNode: null,
  },
}

const editorActions = {
  handWritingEditor: {
  },

  textEditor: {
    setData: (data: string) => () => {
      return {data}
    },
  },

  loadTextNote: (nodeId: GraphNodeId) => async (state: any, actions: any) => {
    const data = await loadNote(nodeId, NoteDataType.TEXT)
    actions.textEditor.setData(data)
  },

  setNode: (node: IGraphNodeData) => () => {
    return {node}
  },
}

export const appActions = {
  graph: graphActions,

  editor: editorActions,

  toolbar: Toolbar.actions,

  contextMenu: ContextMenu.actions,

  onCreate: (el: El) => (state: IState, actions: any) => {
    logger.debug('element created (app)', el)

    actions.graph.init()
    actions.graph.handleGraphActions({
      actionStream: graphActionStream,
      selectNode: actions.selectNode,
    })
  },

  save: () => (_: IState, actions: any) => {
    logger.log('Saving application data')
    return actions.graph.save()
  },

  selectNode: (node: IGraphNodeData) => (state: IState) => {
    setTimeout(() => editorOpenChange.next(), EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY)
    return {
      runtime: {
        ...state.runtime,
        showEditor: true,
        selectedNode: node,
      },
    }
  },

  onEditorClose: () => (state: IState) => {
    setTimeout(() => editorOpenChange.next(), EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY)
    return {
      runtime: {
        ...state.runtime,
        showEditor: false,
      },
    }
  },

  onSearchResultClick: (node: IGraphNodeData) => {
    graphCommandStream.next(new FocusCommand(node))
  },

  resetGraph: () => {
    graphCommandStream.next(new ResetGraphCommand())
  },
}

export function view(state: IState, actions: any) {
  return html.div(
    {
      id: 'app',
      oncreate: (el: El) => actions.onCreate(el),
      onmousedown: (ev: MouseEvent) => {
        let rightclick
        if (ev.which) rightclick = (ev.which === 3)
        else if (ev.button) rightclick = (ev.button === 2)
        logger.log('Rightclick: ' + rightclick)
      },
    },
    [
      ContextMenu.view(
        state.contextMenu,
        actions.contextMenu,
      ),
      Toolbar.view(
        state.toolbar,
        actions.toolbar,
        {
          onBack: emptyFunction,
          onHome: actions.resetGraph,
          onSave: actions.save,
          onSettings: emptyFunction,
          onSearchResultClick: actions.onSearchResultClick,
        },
        (query: string) => search(state.graph.metadata, query),
      ),
      GraphView(
        {height: state.graph.height, width: state.graph.width},
        actions.onGraphReset,
        {index: state.graph.index, metadata: state.graph.metadata},
        graphActionStream,
        actions.graph.resizeGraph,
        editorOpenChangeObservable,
        graphCommandObservable,
      ),
      (state.runtime.showEditor && state.runtime.selectedNode !== null)
        ? Editor(
          state.runtime.selectedNode,
          state.editor,
          actions.editor,
          actions.onEditorClose,
        )
        : Empty(),
    ],
  )
}
