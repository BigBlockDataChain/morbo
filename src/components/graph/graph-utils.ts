import {
  GraphNodeId,
  IGraphChildParentIndex,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
  ILinkTuple,
} from '@lib/types'

export function graphMetadataToList(metadata: IGraphMetadata): IGraphNodeData[] {
  return Object.keys(metadata)
    .map((k: GraphNodeId) => metadata[k])
}

export function flattenGraphIndex(index: IGraphIndex): ILinkTuple[] {
  const keys = Object.keys(index)
  return keys.reduce(
    (accum: ILinkTuple[], source: GraphNodeId) => {
      accum.push(
        ...index[source].map(
          (target: GraphNodeId) => ({id: _linkTupleId(source, target), source, target}),
        ),
      )
      return accum
    },
    [],
  )
}

/**
 * Make a mapping of each child's parent assuming each child has a single parent
 */
export function makeChildParentIndex(index: IGraphIndex): IGraphChildParentIndex {
  const nodeIds = Object.keys(index)

  // Initialize all as having no parent
  const childParentIndex: IGraphChildParentIndex = nodeIds.reduce(
    (_cpIndex: IGraphChildParentIndex, nodeId: GraphNodeId) => {
      _cpIndex[nodeId] = null
      return _cpIndex
    },
    {},
  )

  // Set parents for those that have one
  nodeIds.forEach((parent: GraphNodeId) => {
    index[parent].forEach((child: GraphNodeId) =>
      childParentIndex[child] = parent)
  })

  return childParentIndex
}

function _linkTupleId(source: GraphNodeId, target: GraphNodeId): string {
  return `${source}-${target}`
}
