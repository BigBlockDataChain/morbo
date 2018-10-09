import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import GraphViewComponent from './graph-view-component.js'
import EditorComponent from './editor-component.js'
import DebugComponent from './debug-component.js'

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
  }

  const actions = {
    debugComponent: debugComponent.actions,
    editor: editor.actions,
    graphView: graphView.actions,
    oncreate: el => (state, actions) => // eslint-disable-line no-unused-vars
      ({
        ...state,
        screenHeight: el.offsetHeight,
        screenWidth: el.offsetWidth,
        graphView: graphView.setDimensions(
          state.graphView, el.offsetHeight, el.offsetWidth / 2),
      }),
  }

  const view = function(state, actions) {
    return html.div(
      {
        id: 'app',
        oncreate: el => actions.oncreate(el),
      },
      [
        graphView.view(state.graphView, actions.graphView),
        editor.view(actions.editor),
        debugComponent.view(state.debugComponent, actions.debugComponent, state),
      ]
    )
  }

  // eslint-disable-next-line no-unused-vars
  const app = devtools(hyperapp)(
    state, actions, view, document.querySelector('#root'))
}
