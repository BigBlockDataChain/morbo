export type El = HTMLElement

export interface IState {
  [prop: string]: any,
}

export interface IActions {
  [action: string]: any,
}

export interface IGraphData {
  links: IGraphLink[],
  nodes: IGraphNode[],
}

export type GraphNodeId = number

export enum NoteDataType {
  TEXT = 'text',
  HANDWRITING = 'handwriting',
}

export interface IGraphNode {
  id: GraphNodeId,
  name: string,
  x: number,
  y: number,
  color: string,
}

export interface IGraphLink {
  source: GraphNodeId,
  target: GraphNodeId,
}

export type GraphIndex = GraphNodeIndex[]

export type GraphNodeIndex = GraphNodeId[]

export type GraphMetadata = IGraphMetadatum[]

export interface IGraphMetadatum {
  title: string,
  lastModified: string,
  created: string,
  tags: string[]
}

export interface IDimensions {
  height: number,
  width: number,
}

export type VoidFunction = (...args: any[]) => void
