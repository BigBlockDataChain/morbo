import * as html from '@hyperapp/html'
import {ipcRenderer} from 'electron'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'
import {Subject} from 'rxjs'

import {actions as graphActions} from './actions/graph'
import Editor from './components/editor-component'
import GraphView from './components/graph-view-component'
import {GraphAction} from './components/graph/types'
import Empty from './components/widgets/empty'
import {loadNote} from './io/io'
import {getLogger} from './logger'
import {
  El,
  GraphNodeId,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
  NoteDataType,
} from './types'

const logger = getLogger('main')

const graphActionStream = new Subject<GraphAction>()
const editorOpenChange = new Subject<void>()
const editorOpenChangeObservable = editorOpenChange.asObservable()

const EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY = 500

interface IRuntime {
  showEditor: boolean
  selectedNode: null | IGraphNodeData,
}

interface IState {
  graph: IGraphState
  editor: IEditorState
  settings: any
  runtime: IRuntime
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

const initialState: IState = {
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

const appActions = {
  graph: graphActions,

  editor: editorActions,

  onCreate: (el: El) => (state: IState, actions: any) => {
    logger.debug('element created (app)', el)

    actions.graph.init()
    actions.graph.handleGraphActions({
      actionStream: graphActionStream,
      selectNode: actions.selectNode,
    })
  },

  exit: () => (_: IState, actions: any) => {
    return actions.graph.save()
  },

  selectNode: (node: IGraphNodeData) => (state: IState) => {
    () => editorOpenChange.next()
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
}

function view(state: IState, actions: any) {
  return html.div(
    {
      id: 'app',
      oncreate: (el: El) => actions.onCreate(el),
    },
    [
      GraphView(
        {height: state.graph.height, width: state.graph.width},
        actions.onGraphReset,
        {index: state.graph.index, metadata: state.graph.metadata},
        graphActionStream,
        actions.graph.resizeGraph,
        editorOpenChangeObservable,
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

// @ts-ignore // no unused variables
const app = devtools(hyperapp)(
  initialState,
  appActions,
  view,
  document.querySelector('#root'),
)

window.onbeforeunload = (e: Event) => {
  app.exit()
    .catch(() => {
      alert('Failed to save. Click okay to shutdown anyway')
    })
    .finally(() => {
      ipcRenderer.send('app_quit')
      window.onbeforeunload = null
    })
  // Required by Chrome to prevent default
  e.returnValue = false
}
