import {Subject, timer} from 'rxjs'
import {debounce} from 'rxjs/operators'

import {GraphAction} from '@components/graph/types'
import * as graphTypes from '@components/graph/types'
import {
  loadIndex,
  loadMetadata,
  writeIndex,
  writeMetadata,
} from '@lib/io'
import {getLogger} from '@lib/logger'
import {
  El,
  IGraphNodeData,
  NoteDataType,
} from '@lib/types'
import {assertNever} from '@lib/utils'

const logger = getLogger('actions/graph')

const GRAPH_ACTION_DEBOUNCE_TIME = 50

export const actions: any = {
  init: () => async (_: any, _actions: any) => {
    const loadIndexPromise = loadIndex()
    const loadMetadataPromise = loadMetadata()

    await Promise.all([
      loadIndexPromise,
      loadMetadataPromise,
    ])

    const index = await loadIndexPromise
    const metadata = await loadMetadataPromise

    _actions.setGraphData({
      index,
      metadata,
    })
  },

  save: () => (state: any) => {
    return new Promise((resolve, reject) => {
      const writeIndexPromise = writeIndex(state.index)
      const writeMetadataPromise = writeMetadata(state.metadata)

      // TODO Does Promise all catch errors in one of the promises? If so can avoid the
      // awaits and just reject in a catch block
      Promise.all([
        writeIndexPromise,
        writeMetadataPromise,
      ]).then(async () => {
        try {
          await writeMetadataPromise
          await writeIndexPromise
        } catch (err) {
          logger.warn('Failed to write metadata or index', err)
          reject(err)
        }

        resolve()
      })
    })
  },

  setGraphData: (graph: any) => () => {
    return graph
  },

  handleGraphActions: ({
    actionStream,
    selectNode,
  }: {
    actionStream: Subject<GraphAction>,
    selectNode: (node: IGraphNodeData) => any,
  }) =>
    (_: any, _actions: any) => {
      actionStream
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
          switch (event.kind) {
            case graphTypes.NODE_CLICK_TYPE:
              selectNode(event.node)
              break
            case graphTypes.NODE_RIGHT_CLICK_TYPE:
              break
            case graphTypes.NODE_DBL_CLICK_TYPE:
              break
            case graphTypes.NODE_DRAG_TYPE:
              _actions.setNodePosition(event.node)
              break
            case graphTypes.NODE_HOVER_SHORT_TYPE:
              break
            case graphTypes.NODE_HOVER_END_TYPE:
              break
            case graphTypes.BACKGROUND_CLICK_TYPE:
              break
            case graphTypes.BACKGROUND_DBL_CLICK_TYPE:
              _actions.createNewNode(event.position)
              break
            case graphTypes.ZOOM_TYPE:
              break
            default:
              assertNever(event)
          }
        })
    },

  resizeGraph: (graphViewEl: El) => () => {
    return {
      height: graphViewEl.offsetHeight,
      width: graphViewEl.offsetWidth,
    }
  },

  setNodePosition: (node: IGraphNodeData) => (state: any, _: any) => {
    const metadata = {
      ...state.metadata,
      [node.id]: {
        ...state.metadata[node.id],
        x: node.x,
        y: node.y,
      },
    }

    return {metadata}
  },

  createNewNode: (position: {x: number, y: number}) => (state: any) => {
    const ids = Object.keys(state.index).map(Number).sort((a: number, b: number) => a - b)
    const nextId = ids[ids.length - 1] + 1
    const nodeData: IGraphNodeData = {
      id: nextId,
      title: '',
      lastModified: '',
      created: '',
      x: position.x,
      y: position.y,
      tags: [],
      type: NoteDataType.TEXT
    }

    return {
      index: {...state.index, [nextId]: []},
      metadata: {...state.metadata, [nextId]: nodeData},
    }
  },
}
