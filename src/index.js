import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphViewComponent from './graph-view-component.js'
import EditorComponent from './editor-component.js'
import DebugComponent from './debug-component.js'
import {getLogger} from './logger.js'

const logger = getLogger('main.js')

main()

function main() {
  const graphView = GraphViewComponent()
  const editor = EditorComponent()
  const debugComponent = DebugComponent()

  const state = {
    screenHeight: 0,
    screenWidth: 0,
    debugComponent: debugComponent.state,
    editor: editor.state,
    graphView: graphView.state,
    graphData: {
      nodes: [{
        name: 'A',
        x: 200,
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
    editor: editor.actions,
    graphView: graphView.actions,
    oncreate: el => (state, actions) => {
      logger.debug('element created (app)', el)

      registerEventHandlers(el, actions)

      setTimeout(() => actions.initializeGraphView(), 0)

      return {
        ...state,
        screenHeight: el.offsetHeight,
        screenWidth: el.offsetWidth,
        graphView: graphView.setDimensions(
          state.graphView, el.offsetHeight, el.offsetWidth),
      }
    },
    initializeGraphView: () => (state, actions) => {
      return {
        ...state,
        graphView: graphView.setData(state.graphView, state.graphData),
      }
    },
    onWindowResize: (height, width) => (state, actions) => {
      return {
        ...state,
        screenHeight: height,
        screenWidth: width,
        graphView: graphView.setDimensions(state.graphView, height, width),
      }
    },
    onClickAddRandomNode: () => (state, actions) => {
      const graphData = {...state.graphData}
      graphData.nodes.push({
        name: 'rndNode',
        x: Math.floor(Math.random() * state.screenWidth),
        y: Math.floor(Math.random() * state.screenHeight),
        content: 'random node',
      })

      return {
        ...state,
        graphData,
        graphView: graphView.setData(state.graphView, state.graphData),
      }
    },
    // setRandomEditorData: () => state =>
    //   ({...state, editor: editor.setContent(state.editor, Math.random())}),
  }

  function view(state, actions) {
    return html.div(
      {
        id: 'app',
        oncreate: el => actions.oncreate(el),
      },
      [
        graphView.view(state.graphView, actions.graphView),
        // editor.view(state.editor, actions.editor),
        debugComponent.view(state.debugComponent, actions.debugComponent, state),
        html.button(
          {
            style: {
              position: 'absolute',
              right: 0,
              bottom: 0,
            },
            onclick: () => actions.onClickAddRandomNode(),
          },
          ['add random node'],
        ),
        // html.button(
        //   {onclick: () => actions.setRandomEditorData()},
        //   ['randomize']
        // ),
      ]
    )
  }

  function registerEventHandlers(el, actions) {
    window.addEventListener('resize', () => {
      actions.onWindowResize(el.offsetHeight, el.offsetWidth)
    })
  }

  const app = devtools(hyperapp)(
    state, actions, view, document.querySelector('#root'))
}
