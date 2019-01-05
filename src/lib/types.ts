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

export type GraphNodeId = number

export enum NoteDataType {
  TEXT = 'text',
  HANDWRITING = 'handwriting',
}

export interface IGraphIndex {
  // id type GraphNodeId
  [id: number]: GraphNodeChildren
}

export type GraphNodeChildren = GraphNodeId[]

export interface IGraphMetadata {
  // id type GraphNodeId
  [id: number]: IGraphNodeData
}

export interface IGraphNodeData {
  id: number
  title: string
  lastModified: string
  created: string
  x: number
  y: number
  tags: string[]
  type: NoteDataType
}

export interface IDimensions {
  height: number,
  width: number,
}

export type VoidFunction = (...args: any[]) => void
