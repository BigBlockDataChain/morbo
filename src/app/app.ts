import * as html from '@hyperapp/html'
import {Subject} from 'rxjs'

import OcrLive, {
  IOCRState, 
  IOCRActions, 
} from '@components/editor/ocr-live-component'
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

const MyScriptJS = require('myscript/dist/myscript.esm')
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
}

interface IEditorState {
  node: null | IGraphNodeData
  handWritingEditor: any
  textEditor: any
  liveOcrEditor: IOCRState
}

interface IGraphState {
  index: IGraphIndex
  metadata: IGraphMetadata
  height: number
  width: number
}

export const initialState: IState = {
  toolbar: Toolbar.state,
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
    liveOcrEditor: {
      editor: null,
    }
  },
  settings: {},
  runtime: {
    showEditor: true,
    selectedNode: null,
  },
}

const editorActions = {
  OCREditorActions: {
    setEditorRef: (e: HTMLDivElement) => (state: any, actions: any) => {
      const editor = MyScriptJS.register(e, {
        recognitionParams: {
          type: 'TEXT',
          protocol: 'WEBSOCKET',
          apiVersion: 'V4',
          server: {
            scheme: 'https',
            host: 'webdemoapi.myscript.com',
            applicationKey: 'a4d2a539-b109-4444-8ef7-753d7012e99a',
            hmacKey: 'eb627a17-ffee-47e6-9808-37c4e199ca09',
          },
        },
      });
      window.addEventListener("resize", () => {editor.resize()});
      return {editor}
    },
    removeEditorRef: (e: HTMLDivElement) => (state: any, actions: any) => {
      // window.removeEventListener("resize", resizeCallBack)
    }
  },
  
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
    },
    [
      OcrLive(
        state.editor.liveOcrEditor,
        actions.editor.OCREditorActions,
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
