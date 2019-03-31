import {
  GraphNodeId,
  IBoundingBox,
  IGraphChildParentIndex,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
  ILinkTuple,
  IPosition,
} from '@lib/types'

export function graphMetadataToList(metadata: IGraphMetadata): IGraphNodeData[] {
  return Object.keys(metadata)
    .map(Number)
    .map((k: GraphNodeId) => metadata[k])
}

export function flattenGraphIndex(index: IGraphIndex): ILinkTuple[] {
  const keys = Object.keys(index).map(Number)
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
  const nodeIds = Object.keys(index).map(Number)

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

/**
 * Get intersection point, between a line originating within the rectange and the
 * rectangle
 */
export function intersectLineWithRectange(
  line: {start: IPosition, end: IPosition},
  rect: IBoundingBox,
): IPosition {
  const _line = {
    start: {x: line.start.x, y: line.start.y},
    end: {x: line.end.x, y: line.end.y},
  }

  const [p1, p2] = _line.start.x < _line.end.x
    ? [_line.start, _line.end]
    : [_line.end, _line.start]
  const linEqn = calculateLinearEquationFromPoints(p1, p2)

  // Rect's edges of interest
  let xLine
  let yLine

  // TODO Handle end point inside the rect

  // Left or right edge of interest
  xLine = (_line.start.x < _line.end.x)
    ? rect.xMax
    : rect.xMin
  // Top or bottom edge of interest
  yLine = (_line.start.y < _line.end.y)
    ? rect.yMax
    : rect.yMin

  let xIntersect = xLine
  let yIntersect = yLine

  if (linEqn.m !== 0 && linEqn.m !== Infinity) {
    // Not vertical or horizontal
    const x = (yLine - linEqn.b!) / linEqn.m
    xIntersect = Math.min(Math.max(x, rect.xMin), rect.xMax)
    const y = linEqn.m * xLine + linEqn.b!
    yIntersect = Math.min(Math.max(y, rect.yMin), rect.yMax)
  } else if (linEqn.m === Infinity) {
    // Vertical
    xIntersect = _line.start.x
  } else if (linEqn.m === 0) {
    // Horizontal
    yIntersect = _line.start.y
  }

  return {x: xIntersect, y: yIntersect}
}

/**
 * Find slope and y-intersection of a line that passes through two points
 * Assumes `p1.x <= p2.x`.
 * Returns just a slope of infinity if line is vertical.
 * Returns slope and y intersect otherwise.
 */
export function calculateLinearEquationFromPoints(
  p1: IPosition,
  p2: IPosition,
): {m: number, b?: number} {
  const rise = (p2.y - p1.y)
  const run = (p2.x - p1.x)

  if (run === 0)
    return {m: Infinity}
  else {
    const m = rise / run
    return {
      m,
      b: p1.y - m * p1.x,
    }
  }
}

function _linkTupleId(source: GraphNodeId, target: GraphNodeId): string {
  return `${source}-${target}`
}
