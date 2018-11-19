import * as html from '@hyperapp/html'
import { app as hyperapp } from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphView from './graph-view-component'
import EditorView from './editor-component'
import { getLogger } from './logger'

const logger = getLogger('main')

const state = {
  screenHeight: 0,
  screenWidth: 0,
  showEditor: false,
  selectedNode: null,
  graphData: {
    nodes: [{
      nodeId: 0,
      name: 'A',
      x: 0,
      y: 0,
      content: 'Node A',
    }, {
      name: 'B',
      nodeId: 1,
      x: 140,
      y: 300,
      content: 'Node B',
    }, {
      name: 'C',
      nodeId: 2,
      x: 300,
      y: 300,
      content: 'Node C',
    }, {
      name: 'D',
      nodeId: 3,
      x: 310,
      y: 180,
      content: 'Node D',
    }, {
      name: 'E',
      nodeId: 4,
      x: 320,
      y: 300,
      content: 'Node E',
    }, {
      name: 'F',
      nodeId: 5,
      x: 330,
      y: 180,
      content: 'Node F',
    }, {
      name: 'G',
      nodeId: 6,
      x: 350,
      y: 200,
      content: 'Node G',
    }],
    links: [{
      source: 0,
      target: 1,
    }, {
      source: 1,
      target: 2,
    }, {
      source: 2,
      target: 3,
    }, {
      source: 3,
      target: 4,
    }],
  },
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

  onWindowResize: ({ height, width }) => (state, actions) => {
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
      showEditor: false,
    }
  },

  onGraphDblClick: ev => (state, actions) => {
    logger.log('graph double clicked', ev)
    const selectedNode = ev
    return {
      ...state,
      selectedNode,
      showEditor: true,
    }
  },

  // eslint-disable-next-line max-statements
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
    const newNode = { ...oldNode }
    newNode.content = content

    const oldList = state.graphData.nodes
    const newList = [...oldList]
    newList[selectedNodeIndex] = newNode

    const oldData = state.graphData
    const newData = { ...oldData, nodes: newList }

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
        { height: state.screenHeight, width: state.screenWidth },
        { onclick: actions.onGraphClick, ondblclick: actions.onGraphDblClick },
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
    actions.onWindowResize({ height: el.offsetHeight, width: el.offsetWidth })
  })
}

const app = devtools(hyperapp)(state, actions, view, document.querySelector('#root'))
