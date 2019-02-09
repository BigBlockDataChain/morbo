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

/**
 * Parent child index
 */
export interface IGraphIndex {
  // id type GraphNodeId
  [id: number]: GraphNodeChildren
}

/**
 * Child parent index
 */
export interface IGraphChildParentIndex {
  // id type GraphNodeId
  [id: number]: null | GraphNodeId
}

export type GraphNodeChildren = GraphNodeId[]

export interface IGraphMetadata {
  // id type GraphNodeId
  [id: number]: IGraphNodeData
}

export interface IGraphNodeData {
  id: number
  title: string
  lastModified: Date
  created: Date
  x: number
  y: number
  tags: string[]
  type: undefined | NoteDataType
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

// export type SearchResults = ISearchResult[]
export type SearchResults = any

// interface ISearchResultMatch {
//   indices: Array<[number, number]>
//   value: string
//   key: string
//   arrayIndex: number
// }

// export interface ISearchResult {
//   item: any
//   matches: ISearchResultMatch[]
//   score: number
// }

export type VoidFunction = (...args: any[]) => void
