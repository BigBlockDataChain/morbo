import {defaultLinks, defaultNodes} from './sample-graph-data'
import {IGraphData} from './types'

export function loadGraphData(): IGraphData {
  return {nodes: defaultNodes, links: defaultLinks}
}
