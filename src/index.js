import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphView from './graph-view-component'
import EditorComponent from './editor-component'
import DebugComponent from './debug-component'
import {getLogger} from './logger'

const logger = getLogger('main')

const editor = EditorComponent()
const debugComponent = DebugComponent()

const state = {
  screenHeight: 0,
  screenWidth: 0,
  debugComponent: debugComponent.state,
  // editor: editor.state,
  graphData: {
    nodes: [{
      name: 'A',
      x: 300,
      y: 150,
      content: 'Node A',
    }, {
      name: 'B',
      x: 140,
      y: 300,
      content: 'Node B',
    }, {
      name: 'C',
      x: 300,
      y: 300,
      content: 'Node C',
    }, {
      name: 'D',
      x: 300,
      y: 180,
      content: 'Node D',
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
    }],
  },
}

const actions = {
  debugComponent: debugComponent.actions,
  // editor: editor.actions,
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
  },
  onGraphDblClick: ev => (state, actions) => {
    logger.log('graph double clicked', ev)
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
    ]
  )
}

function registerEventHandlers(el, actions) {
  window.addEventListener('resize', () => {
    actions.onWindowResize({height: el.offsetHeight, width: el.offsetWidth})
  })
}

const app = devtools(hyperapp)(state, actions, view, document.querySelector('#root'))
