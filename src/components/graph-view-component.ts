import * as html from '@hyperapp/html'

import {getLogger} from '../logger'
import {El, IDimensions, IGraphData} from '../types'
import D3Graph from './graph/graph'
import homeIcon from './widgets/home-icon'

const logger = getLogger('graph-view-component')

const d3Graph = new D3Graph()

export default function(
  dimensions: IDimensions,
  onHomeClick: () => any,
  callbacks: any,
  graphData: any,
) {
  return html.div(
    {
      id: 'graph-view-component',
      style: {
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      },
    },
    [
      homeIcon(onHomeClick),
      d3Container(dimensions, callbacks, graphData),
    ],
  )
}

function d3Container(dimensions: IDimensions, callbacks: any, graphData: IGraphData) {
  return html.div(
    {
      id: 'd3-container',
      style: {
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      },
      oncreate: (el: El) => {
        d3Graph.init(el, {height: dimensions.height, width: dimensions.width})
        d3Graph.render(graphData, callbacks)
      },
      onupdate: (el: El, prevAttrs: any) => {
        if (dimensions !== prevAttrs.dimensions)
          d3Graph.init(el, {height: dimensions.height, width: dimensions.width})

        if (callbacks !== prevAttrs.callbacks)
          d3Graph.render(graphData, callbacks)

        if (graphData !== prevAttrs.graphData)
          d3Graph.render(graphData, callbacks)
      },
    },
  )
}