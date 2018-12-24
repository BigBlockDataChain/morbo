import * as html from '@hyperapp/html'
import {ActionResult, app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'
import {Subject, timer} from 'rxjs'
import {debounce} from 'rxjs/operators'

import {actions as graphActions} from './actions/graph'
// import EditorView from './components/editor-component'
import GraphView from './components/graph-view-component'
import {GraphAction} from './components/graph/types'
import * as graphTypes from './components/graph/types'
// import Empty from './components/widgets/empty'
import {getLogger} from './logger'
import {
  El,
  IDimensions,
  IGraphIndex,
  IGraphMetadata,
} from './types'

const logger = getLogger('main')

const graphActionStream = new Subject<GraphAction>()

const GRAPH_ACTION_DEBOUNCE_TIME = 50

interface IConfig {
  screenHeight: number
  screenWidth: number
  showEditor: boolean
}

interface IState {
  graph: IGraphState
  editor: IEditorState
  settings: any
  config: IConfig
}

interface IEditorState {
  handWritingEditor: any
  textEditor: any
}

interface IGraphState {
  index: IGraphIndex
  metadata: IGraphMetadata
}

const initialState: IState = {
  graph: {
    index: {},
    metadata: {},
  },
  editor: {
    handWritingEditor: {},
    textEditor: {},
  },
  settings: {},
  config: {
    screenHeight: 0,
    screenWidth: 0,
    showEditor: false,
  },
}

interface IActions {
  [action: string]:
    (arg?: any) => (state?: IState, actions?: IActions) => ActionResult<IState>
}

const appActions = {
  graph: graphActions,
  oncreate: (el: El) => (state: IState, actions: any) => {
    logger.debug('element created (app)', el)

    registerEventHandlers(el, actions)

    actions.graph.init()

    graphActionStream
      .pipe(
        debounce((event: GraphAction) => {
          const time = (event.kind === graphTypes.ZOOM_TYPE
                        || event.kind === graphTypes.NODE_DRAG_TYPE)
            ? GRAPH_ACTION_DEBOUNCE_TIME
            : 0
          return timer(time)
        }),
      )
      .subscribe((event: GraphAction) => {
        // TODO handle graph events
      })

    return {
      config: {
        screenHeight: el.offsetHeight,
        screenWidth: el.offsetWidth,
      },
    }
  },

  onWindowResize: ({height, width}: IDimensions) => (state: IState) => {
    return {
      config: {
        ...state.config,
        screenHeight: height,
        screenWidth: width,
      },
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
        {height: state.config.screenHeight, width: state.config.screenWidth},
        actions.onGraphReset,
        {index: state.graph.index, metadata: state.graph.metadata},
        graphActionStream,
      ),
      // state.showEditor && state.selectedNode !== null
      //   ? EditorView(
      //     state.selectedNode.content,
      //     actions.onEditorInput,
      //     actions.onEditorClose,
      //   )
      //   : Empty(),
    ],
  )
}

function registerEventHandlers(el: El, actions: IActions) {
  window.addEventListener('resize', () => {
    actions.onWindowResize({height: el.offsetHeight, width: el.offsetWidth})
  })
}

// @ts-ignore // no unused variables
const app = devtools(hyperapp)(
  initialState,
  appActions,
  view,
  document.querySelector('#root'),
)
