import {defaultNodes, defaultLinks} from './sample-graph-data'
import {GraphData} from './types'

export function loadGraphData(): GraphData {
  return {nodes: defaultNodes, links: defaultLinks}
}
