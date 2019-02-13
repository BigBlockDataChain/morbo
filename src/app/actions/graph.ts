import {timer} from 'rxjs'
import {debounce} from 'rxjs/operators'

import {
  EditNodeMetadataCommand,
  FocusCommand,
  GraphAction,
  ResetGraphCommand,
} from '@components/graph/types'
import * as graphTypes from '@components/graph/types'
import {
  deleteNote,
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
import {
  graphActionObservable,
  graphCommandStream,
} from './graph-streams'

const logger = getLogger('actions/graph')

const GRAPH_ACTION_DEBOUNCE_TIME = 50
const GRAPH_FOCUS_AFTER_NEW_NODE_CREATED_DELAY = 250

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

    _actions._setGraphData({
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

  resizeGraph: (graphViewEl: El) => () => {
    return {
      height: graphViewEl.offsetHeight,
      width: graphViewEl.offsetWidth,
    }
  },

  resetGraph: () => {
    graphCommandStream.next(new ResetGraphCommand())
  },

  focusNode: (nodeId: GraphNodeId) => () => {
    graphCommandStream.next(new FocusCommand({nodeId}))
  },

  updateNodeMetadata: (node: IGraphNodeData) => (state: any) => {
    const metadata = {...state.metadata}
    metadata[node.id] = {
      ...metadata[node.id],
      title: node.title,
      lastModified: node.lastModified,
      tags: node.tags,
      type: node.type,
    }

    graphCommandStream.next(new EditNodeMetadataCommand(node))

    return {metadata}
  },

  createNewNode: ({
      position,
      parent,
      selectNode,
      newNodeCallback = undefined,
    }: {
      position: IPosition,
      parent: null | GraphNodeId,
      selectNode?: (nodeId: GraphNodeId) => any,
      newNodeCallback?: (nodeId: GraphNodeId) => any,
    },
  ) =>
    (state: any, _actions: any) => {
      const ids = Object.keys(state.index)
        .map(Number)
        .sort((a: number, b: number) => a - b)
      const nextId = ids[ids.length - 1] + 1 || 1
      const currentDate = new Date().toString()
      const nodeData: IGraphNodeData = {
        id: nextId,
        title: 'Note ' + nextId,
        lastModified: currentDate,
        created: currentDate,
        x: position.x,
        y: position.y,
        tags: [],
        type: undefined,
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

      setTimeout(
        () => _actions.focusNode(nextId), GRAPH_FOCUS_AFTER_NEW_NODE_CREATED_DELAY)
      if (selectNode)
        setTimeout(() => selectNode(nextId), GRAPH_FOCUS_AFTER_NEW_NODE_CREATED_DELAY)

      if (newNodeCallback)
        setTimeout(() => newNodeCallback(nextId))

      return {
        index,
        metadata: {...state.metadata, [nextId]: nodeData},
      }
    },

  handleGraphActions: ({
    selectNode,
  }: {
    selectNode: (nodeId: GraphNodeId) => any,
  }) =>
    (_: any, _actions: any) => {
      graphActionObservable
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
              _actions.createNewNode(
                {position: event.position, parent: event.parent, selectNode})
              break
            case graphTypes.EDIT_NODE_TYPE:
              selectNode(event.id)
              break
            case graphTypes.DELETE_NODE_TYPE:
              _actions._deleteNode(event.nodeId)
              break
            case graphTypes.SET_NODE_PARENT_TYPE:
              _actions._setNodeParent({parent: event.parent, child: event.child})
              break
            case graphTypes.NODE_CLICK_TYPE:
              break
            case graphTypes.NODE_RIGHT_CLICK_TYPE:
              break
            case graphTypes.NODE_DBL_CLICK_TYPE:
              selectNode(event.nodeId)
              break
            case graphTypes.NODE_DRAG_TYPE:
              _actions._setNodePosition({nodeId: event.nodeId, position: event.position})
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
            case graphTypes.DELETE_LINK_TYPE:
              _actions._deleteLink({source: event.source, target: event.target})
              break
            default:
              assertNever(event)
          }
        })
    },

  _setGraphData: (graph: any) => () => {
    return graph
  },

  _setNodePosition: ({nodeId, position}: {nodeId: GraphNodeId, position: IPosition}) =>
    (state: any, _: any) => {
      const metadata = {
        ...state.metadata,
        [nodeId]: {
          ...state.metadata[nodeId],
          x: position.x,
          y: position.y,
        },
      }

      return {metadata}
    },

  _deleteNode: (nodeId: GraphNodeId) => (state: any) => {
    // Remove from index and from parent's adjacency list
    const index = {...state.index}
    delete index[nodeId]
    Object.keys(index)
      .forEach((k: string) => {
        index[k] = index[k].filter((l: GraphNodeId) => l !== nodeId)
      })

    const metadata = {...state.metadata}

    // Delete file
    deleteNote(nodeId, metadata[nodeId].type)

    // Delete from metadata
    delete metadata[nodeId]
    return {
      index,
      metadata,
    }
  },

  _deleteLink: ({source, target}: {source: GraphNodeId, target: GraphNodeId}) =>
    (state: any) => {
      const index = {...state.index}
      index[source] = index[source].filter((c: GraphNodeId) => c !== target)
      return {index}
    },

  _setNodeParent: ({parent, child}: {parent: GraphNodeId, child: GraphNodeId}) =>
    (state: any) => {
      const index = {...state.index}
      index[parent] = [...index[parent], child]
      return {index}
    },
}
