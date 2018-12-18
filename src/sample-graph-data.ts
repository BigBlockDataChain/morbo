import {GraphNodeId, GraphNode, GraphLink} from './types'

export const defaultNodes: GraphNode[] = [
  graphNode(0, 'node-0', 100, 100, 'red'),
  graphNode(1, 'node-1', 200, 100, 'green'),
  graphNode(2, 'node-2', 200, 200, 'blue'),
  graphNode(20, 'node-20', 300, 200, 'blue'),
  graphNode(21, 'node-21', 300, 250, 'blue'),
  graphNode(210, 'node-220', 400, 250, 'blue'),
  graphNode(211, 'node-221', 400, 300, 'blue'),
]

export const defaultLinks: GraphLink[] = [
  {source: 1, target: 2},
  {source: 2, target: 0},
  {source: 2, target: 20},
  {source: 2, target: 21},
  {source: 21, target: 210},
  {source: 21, target: 211},
]

function graphNode(
  id: GraphNodeId,
  name: string,
  x: number,
  y: number,
  color: string
): GraphNode {
  return {
    id,
    name,
    x,
    y,
    color,
  }
}
