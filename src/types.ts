export type El = HTMLElement

export interface State {
  [prop: string]: any,
}

export interface Actions {
  [action: string]: any,
}

export interface GraphData {
  links: GraphLink[],
  nodes: GraphNode[],
}

export type GraphNodeId = number

export interface GraphNode {
  id: GraphNodeId,
  name: string,
  x: number,
  y: number,
  color: string,
}

export interface GraphLink {
  source: GraphNodeId,
  target: GraphNodeId,
}

export interface Dimensions {
  height: number,
  width: number,
}

export type VoidFunction = (...args: any[]) => void
