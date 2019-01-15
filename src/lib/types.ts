export type El = HTMLElement

export interface IState {
  [prop: string]: any
}

export interface IActions {
  [action: string]: any
}

export interface IGraphData {
  index: IGraphIndex
  metadata: IGraphMetadata
}

export type GraphNodeId = string

export enum NoteDataType {
  TEXT = 'text',
  HANDWRITING = 'handwriting',
}

/**
 * Parent child index
 */
export interface IGraphIndex {
  // id type GraphNodeId
  [id: string]: GraphNodeChildren
}

/**
 * Child parent index
 */
export interface IGraphChildParentIndex {
  // id type GraphNodeId
  [id: string]: null | GraphNodeId
}

export type GraphNodeChildren = GraphNodeId[]

export interface IGraphMetadata {
  // id type GraphNodeId
  [id: string]: IGraphNodeData
}

export interface IGraphNodeData {
  id: string
  title: string
  lastModified: string
  created: string
  x: number
  y: number
  tags: string[]
}

export interface IDimensions {
  height: number,
  width: number,
}

export interface IPosition { x: number, y: number }

export interface ILinkTuple {
  id: string
  source: GraphNodeId
  target: GraphNodeId
}

export type VoidFunction = (...args: any[]) => void
