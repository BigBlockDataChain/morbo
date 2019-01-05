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
  GraphNodeId,
  IGraphNodeData,
  IPosition,
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
    selectNode: (nodeId: GraphNodeId) => any,
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
            case graphTypes.CREATE_NEW_NODE_TYPE:
              _actions.createNewNode({position: event.position, parent: event.parent})
              break
            case graphTypes.EDIT_NODE_TYPE:
              selectNode(event.id)
              break
            case graphTypes.DELETE_NODE_TYPE:
              // TODO Have to setup 'exit' on D3 node rendering code to remove delete node
              // and deleted links to avoid runtime errors
              // _actions.deleteNode(event.nodeId)
              break
            case graphTypes.NODE_CLICK_TYPE:
              break
            case graphTypes.NODE_RIGHT_CLICK_TYPE:
              break
            case graphTypes.NODE_DBL_CLICK_TYPE:
              selectNode(event.nodeId)
              break
            case graphTypes.NODE_DRAG_TYPE:
              // TODO Was causing some runtime errors, investigate cause and fix
              // _actions.setNodePosition(event.nodeId)
              break
            case graphTypes.NODE_HOVER_SHORT_TYPE:
              break
            case graphTypes.NODE_HOVER_END_TYPE:
              break
            case graphTypes.BACKGROUND_CLICK_TYPE:
              break
            case graphTypes.BACKGROUND_DBL_CLICK_TYPE:
              // NOTE: Disabled for now, not sure if it's a good interaction mechanism due
              // to chance to accidental click resulting in poor user experience
              // _actions.createNewNode({position: event.position})
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

  createNewNode: (
    {position, parent}: {position: IPosition, parent: null | GraphNodeId},
  ) =>
    (state: any) => {
      const ids = Object.keys(state.index)
        .map(Number)
        .sort((a: number, b: number) => a - b)
      const nextId = ids[ids.length - 1] + 1 || 0
      const nodeData: IGraphNodeData = {
        id: nextId,
        title: 'File ' + nextId,
        lastModified: '',
        created: '',
        x: position.x,
        y: position.y,
        tags: [],
      }

      // Set parent if specified
      let index
      if (parent !== null) {
        const originalParentIndex = state.index[parent]
        index = {
          ...state.index,
          [parent]: [...originalParentIndex, nextId],
          [nextId]: [],
        }
      } else {
        index = {
          ...state.index,
          [nextId]: [],
        }
      }

      return {
        index,
        metadata: {...state.metadata, [nextId]: nodeData},
      }
    },

  deleteNode: (nodeId: GraphNodeId) => (state: any) => {
    const index = {...state.index}
    delete index[nodeId]
    const metadata = {...state.metadata}
    delete metadata[nodeId]
    return {
      index,
      metadata,
    }
  },
}
