import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphView from './graph-view-component'
import EditorView from './editor-component'
import {getLogger} from './logger'
import {loadGraphData} from './graph-data'

const logger = getLogger('main')

const allGraphData = loadGraphData()

const initialState = {
  screenHeight: 0,
  screenWidth: 0,
  showEditor: false,
  selectedNode: null,
  allGraphData,
  graphData: null,
}

const appActions = {
  oncreate: el => (state, actions) => {
    logger.debug('element created (app)', el)

    registerEventHandlers(el, actions)

    return {
      screenHeight: el.offsetHeight,
      screenWidth: el.offsetWidth,
      graphData: state.allGraphData,
    }
  },

  onWindowResize: ({height, width}) => () => {
    return {
      screenHeight: height,
      screenWidth: width,
    }
  },

  onGraphReset: () => () => {
    logger.log('graph view reset')
  },

  onGraphClick: ev => () => {
    logger.log('graph clicked', ev)
    const selectedNode = ev
    return {
      selectedNode,
    }
  },

  onGraphDblClick: ev => () => {
    logger.log('graph double clicked', ev)

    const selectedNode = ev
    return {
      selectedNode,
      showEditor: true,
    }
  },

  // TODO Causes unecessary D3 rendering calls. Need to decouple node data from nodes
  onEditorInput: content => state => {
    if (state.selectedNode === null) {
      logger.warn('Trying to set content, but no node is selected')
      return
    }

    const selectedNodeIndex = state.graphData.nodes
      .findIndex(n => n.name === state.selectedNode.name)
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

function view(state, actions) {
  return html.div(
    {
      id: 'app',
      oncreate: el => actions.oncreate(el),
    },
    [
      GraphView(
        {height: state.screenHeight, width: state.screenWidth},
        actions.onGraphReset,
        {onclick: actions.onGraphClick, ondblclick: actions.onGraphDblClick},
        state.graphData
      ),
      state.showEditor && state.selectedNode !== null
        ? EditorView(
          state.selectedNode.content,
          actions.onEditorInput,
          actions.onEditorClose,
        )
        : null,
    ]
  )
}

function registerEventHandlers(el, actions) {
  window.addEventListener('resize', () => {
    actions.onWindowResize({height: el.offsetHeight, width: el.offsetWidth})
  })
}

const app = devtools(hyperapp)(
  initialState, appActions, view, document.querySelector('#root'))
