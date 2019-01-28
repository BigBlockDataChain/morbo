import * as html from '@hyperapp/html'
import {Subject} from 'rxjs'

import * as Editor from '@components/editor/editor-component'
import GraphView from '@components/graph/graph-view-component'
import Settings from '@components/settings/settings-component'
import * as Toolbar from '@components/toolbar/toolbar-component'
import Empty from '@components/widgets/empty'
import {initDataDirectory} from '@lib/io'
import {getLogger} from '@lib/logger'
import * as Search from '@lib/search'
import {
  El,
  GraphNodeId,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
} from '@lib/types'
import {emptyFunction} from '@lib/utils'
import {actions as graphActions} from './actions/graph'
import {
  graphActionStream,
  graphCommandObservable,
} from './actions/graph-streams'

import './app.css'

const logger = getLogger('main')

const editorOpenChange = new Subject<void>()
const editorOpenChangeObservable = editorOpenChange.asObservable()

const EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY = 250

interface IState {
  graph: IGraphState
  editor: any
  settings: any
  runtime: IRuntime
  toolbar: any
  search: any
}

interface IGraphState {
  index: IGraphIndex
  metadata: IGraphMetadata
  height: number
  width: number
}

interface IRuntime {
  showEditor: boolean
  selectedNode: null | GraphNodeId,
  settingsOpen: boolean
}

export const initialState: IState = {
  toolbar: Toolbar.state,
  editor: Editor.state,
  graph: {
    index: {},
    metadata: {},
    height: 0,
    width: 0,
  },
  settings: {},
  runtime: {
    showEditor: true,
    selectedNode: null,
    settingsOpen: true,
  },
  search: Search.state,
}

export const appActions = {
  graph: graphActions,
  editor: Editor.actions,
  toolbar: Toolbar.actions,
  search: Search.actions,

  onCreate: (el: El) => async (state: IState, actions: any) => {
    logger.debug('element created (app)', el)

    try {
      await initDataDirectory()
    } catch (err) {
      logger.error('Failed to create data directory')
    }

    actions.graph.init()
    actions.graph.handleGraphActions({
      selectNode: actions.selectNode,
    })
  },

  save: () => (_: IState, actions: any) => {
    logger.log('Saving application data')
    return actions.graph.save()
  },

  selectNode: (nodeId: GraphNodeId) => (state: IState) => {
    setTimeout(() => editorOpenChange.next(), EDITOR_OPEN_CHANGE_OBSERVABLE_DELAY)
    return {
      runtime: {
        ...state.runtime,
        showEditor: true,
        selectedNode: nodeId,
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

  onEditorUpdateMetadata: (node: IGraphNodeData) => (state: IState, actions: any) => {
    actions.graph.updateNodeMetadata(node)
  },

  toggleSettingsPanel: () => (state: IState, actions: any) => {
    return {
      runtime: {
        ...state.runtime,
        settingsOpen: !state.runtime.settingsOpen,
      },
    }
  },

  onSearchResultClick: (node: IGraphNodeData) => (_: IState, actions: any) => {
    actions.graph.focusNode(node.id)
  },

  resetGraph: () => (_: IState, actions: any) => {
    actions.graph.resetGraph()
  },
}

export function view(state: IState, actions: any) {
  return html.div(
    {
      id: 'app',
      oncreate: (el: El) => actions.onCreate(el),
    },
    [
      Toolbar.view(
        state.toolbar,
        actions.toolbar,
        {
          onBack: emptyFunction,
          onHome: actions.resetGraph,
          onSettings: actions.toggleSettingsPanel,
          onSearchResultClick: actions.onSearchResultClick,
        },
        (query: string) => actions.search.search({metadata: state.graph.metadata, query}),
      ),
      (state.runtime.settingsOpen === false)
        ? Settings(
          actions.toggleSettingsPanel,
        )
        : Empty(),
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
        ? Editor.view(
            state.editor,
            actions.editor,
            state.graph.metadata[state.runtime.selectedNode],
            actions.onEditorClose,
            actions.onEditorUpdateMetadata,
            actions.graph.deleteNode,
          )
        : Empty(),

        html.div(
          {
            id: 'drag',
            style: {
              position: 'absolute',
              bottom: 0,
              right: 0,
              height: '200px',
              width: '200px',
              background: 'White',
            },

            ondragover: (ev: any) => {
              ev.preventDefault()
              ev.stopPropagation()
              console.log("dragging")
            },

            ondragleave: (ev: any) => {
              ev.preventDefault()
              ev.stopPropagation()
              console.log("leaving")
            },

            ondrop: (ev: any) => {
              ev.preventDefault()
              ev.stopPropagation()
              for (const f of ev.dataTransfer.files) {
                console.log(f.path)
                let reader = new FileReader()
                reader.readAsDataURL(f)
                reader.onloadend = function() {
                  const x = reader.result!.toString().split(',')[1]
                  console.log(atob(x))
              }
            }
          },

          }
        )
      ],
    )
  }
