import {GraphNodeId, IGraphMetadata, IGraphNodeData} from './types'

export default function(metadata: IGraphMetadata, query: string): Promise<any> {
  return new Promise(resolve => {
    resolve(_search(metadata, query))
  })
}

function _search(metadata: IGraphMetadata, query: string): IGraphNodeData[] {
  if (query.trim() === '') {
    return []
  }
  return Object.keys(metadata)
    .map(Number)
    .filter((k: GraphNodeId) =>
      metadata[k].title.toLowerCase().includes(query.toLowerCase()))
    .map((k: GraphNodeId) => metadata[k])
}
