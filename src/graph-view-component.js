import * as html from '@hyperapp/html'

import D3Graph from './d3-graph'
import {getLogger} from './logger'

const logger = getLogger('graph-view-component')

const d3Graph = new D3Graph()

export default function(dimensions, callbacks, graphData) {
  return html.div(
    {
      id: 'd3-container',
      style: {
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      },
      oncreate: el => {
        d3Graph.init(el, {height: dimensions.height, width: dimensions.width})
        d3Graph.render(graphData, callbacks)
      },
      onupdate: (el, prevAttrs) => {
        if (dimensions != prevAttrs.dimensions)
          d3Graph.init(el, {height: dimensions.height, width: dimensions.width})

        if (callbacks != prevAttrs.callbacks)
          d3Graph.init(el, {height: dimensions.height, width: dimensions.width})

        if (graphData != prevAttrs.graphData)
          d3Graph.render(graphData, callbacks)
      },
    }
  )
}
