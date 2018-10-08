import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'

import GraphViewComponent from './graph-view-component.js'
import EditorComponent from './editor-component.js'

main()

function main() {
  const graphView = GraphViewComponent()
  const editor = EditorComponent()

  const state = {
    screenHeight: 0,
    screenWidth: 0,
    graphView: graphView.state,
    editor: editor.state,
  }

  const actions = {
    // eslint-disable-next-line no-unused-vars
    onInit: el => (state, actions) =>
      // eslint-disable-next-line no-warning-comments
      // TODO: Fix ...state
      ({
        screenHeight: el.offsetHeight,
        screenWidth: el.offsetWidth,
        graphView: graphView.setDimensions(el.offsetHeight, el.offsetWidth / 2),
      }),

    graphView: graphView.actions,

    editor: editor.actions,
  }

  const view = function(state, actions) {
    return html.div(
      {
        id: 'app',
        oncreate: el => actions.onInit(el),
      },
      [
        graphView.view(actions.graphView),
        editor.view(actions.editor),
        viewDebugPanel(state),
      ]
    )
  }

  // eslint-disable-next-line no-unused-vars
  const app = hyperapp(state, actions, view, document.querySelector('#root'))
}

function viewDebugPanel(state) {
  return html.div(
    {
      id: 'debug-panel',
      style: {
        display: 'flex',
        flexDirection: 'column',
      },
    },
    [
      html.div(['height ', state.screenHeight]),
      html.div(['width ', state.screenWidth]),
    ]
  )
}
