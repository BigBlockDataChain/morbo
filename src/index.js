import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphView from './graph-view-component'
import EditorView from './editor-component'
import {getLogger} from './logger'
import {retrieveGraphData} from './graph-data'

const logger = getLogger('main')

const state = {
  screenHeight: 0,
  screenWidth: 0,
  showEditor: false,
  selectedNode: null,
  graphData: retrieveGraphData(1),
}

const actions = {
  oncreate: el => (state, actions) => {
    logger.debug('element created (app)', el)

    registerEventHandlers(el, actions)

    return {
      ...state,
      screenHeight: el.offsetHeight,
      screenWidth: el.offsetWidth,
    }
  },

  onWindowResize: ({height, width}) => (state, actions) => {
    return {
      ...state,
      screenHeight: height,
      screenWidth: width,
    }
  },

  onGraphClick: ev => (state, actions) => {
    logger.log('graph clicked', ev)
    const selectedNode = ev
    return {
      ...state,
      selectedNode,
      showEditor: true,
    }
  },

  onGraphDblClick: ev => (state, actions) => {
    logger.log('graph double clicked', ev)
    const newGraphData = retrieveGraphData(ev.nodeId)

    const selectedNode = ev
    return {
      ...state,
      selectedNode,
      showEditor: false,
      graphData: newGraphData,
    }
  },

  onEditorInput: content => (state, actions) => {
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
      ...state,
      graphData: newData,
      selectedNode: newNode,
    }
  },

  onEditorClose: () => (state, actions) => {
    return {
      ...state,
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

const app = devtools(hyperapp)(state, actions, view, document.querySelector('#root'))
