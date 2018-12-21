import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'
import {Subject} from 'rxjs'

import EditorView from './components/editor-component'
import GraphView from './components/graph-view-component'
import {GraphAction} from './components/graph/types'
import Empty from './components/widgets/empty'
import {loadGraphData} from './graph-data'
import * as io from './io/io'
import {getLogger} from './logger'
import {
  El,
  IActions,
  IDimensions,
  IGraphNode,
  IState,
  NoteDataType,
} from './types'

const logger = getLogger('main')

const allGraphData = loadGraphData()

const graphActionStream = new Subject<GraphAction>()

const initialState: IState = {
  screenHeight: 0,
  screenWidth: 0,
  showEditor: false,
  selectedNode: null,
  allGraphData,
  graphData: null,
}

const appActions: IActions = {
  oncreate: (el: El) => (state: IState, actions: IActions) => {
    logger.debug('element created (app)', el)

    registerEventHandlers(el, actions)

    graphActionStream.subscribe(event => {
      // TODO handle graph events
    })

    return {
      screenHeight: el.offsetHeight,
      screenWidth: el.offsetWidth,
      graphData: state.allGraphData,
    }
  },

  onWindowResize: ({height, width}: IDimensions) => () => {
    return {
      screenHeight: height,
      screenWidth: width,
    }
  },

  onGraphReset: () => () => {
    logger.log('graph view reset')
  },

  onGraphClick: (ev: Event) => () => {
    logger.log('graph clicked', ev)
    const selectedNode = ev
    return {
      selectedNode,
    }
  },

  onGraphDblClick: (ev: Event) => () => {
    logger.log('graph double clicked', ev)

    const selectedNode = ev
    return {
      selectedNode,
      showEditor: true,
    }
  },

  // TODO Causes unecessary D3 rendering calls. Need to decouple node data from nodes
  onEditorInput: (content: string) => (state: IState) => {
    if (state.selectedNode === null) {
      logger.warn('Trying to set content, but no node is selected')
      return
    }

    const selectedNodeIndex = state.graphData.nodes
      .findIndex((n: IGraphNode) => n.name === state.selectedNode.name)
    if (selectedNodeIndex === -1) {
      logger.warn('Could not find selected node in list of all node')
      return
    }

    const oldNode = state.graphData.nodes[selectedNodeIndex]
    const newNode = {...oldNode}
    newNode.content = content

    const oldList = state.graphData.nodes
    const newList = [...oldList]
    newList[selectedNodeIndex] = newNode

    const oldData = state.graphData
    const newData = {...oldData, nodes: newList}

    return {
      graphData: newData,
      selectedNode: newNode,
    }
  },

  onEditorClose: () => () => {
    return {
      selectedNode: null,
      showEditor: false,
    }
  },
}

function view(state: IState, actions: IActions) {
  return html.div(
    {
      id: 'app',
      oncreate: (el: El) => actions.oncreate(el),
    },
    [
      GraphView(
        {height: state.screenHeight, width: state.screenWidth},
        actions.onGraphReset,
        state.graphData,
        graphActionStream,
      ),
      state.showEditor && state.selectedNode !== null
        ? EditorView(
          state.selectedNode.content,
          actions.onEditorInput,
          actions.onEditorClose,
        )
        : Empty(),
    ],
  )
}

function registerEventHandlers(el: El, actions: IActions) {
  window.addEventListener('resize', () => {
    actions.onWindowResize({height: el.offsetHeight, width: el.offsetWidth})
  })
}

const app = devtools(hyperapp)(
  initialState,
  appActions,
  view,
  document.querySelector('#root'),
)
