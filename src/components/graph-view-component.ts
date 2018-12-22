import * as html from '@hyperapp/html'
import {Subject} from 'rxjs'

import {El, IDimensions, IGraphData} from '../types'
import GraphComponent from './graph/graph'
import {GraphAction} from './graph/types'
import HomeIcon from './widgets/home-icon'

const graphComponent = new GraphComponent()

export default function(
  dimensions: IDimensions,
  onHomeClick: () => any,
  graphData: any,
  graphActionStream: Subject<GraphAction>,
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
      HomeIcon(onHomeClick),
      d3Container(dimensions, graphData, graphActionStream),
    ],
  )
}

function d3Container(
  dimensions: IDimensions,
  graphData: IGraphData,
  graphActionStream: Subject<GraphAction>,
) {
  return html.div(
    {
      id: 'd3-container',
      style: {
        width: dimensions.width + 'px',
        height: dimensions.height + 'px',
      },
      oncreate: (el: El) => {
        graphComponent.init(
          el,
          {height: dimensions.height, width: dimensions.width},
          graphActionStream,
        )
        graphComponent.render(graphData)
      },
      onupdate: (el: El, prevAttrs: any) => {
        if (dimensions !== prevAttrs.dimensions)
          graphComponent.init(
            el,
            {height: dimensions.height, width: dimensions.width},
            graphActionStream,
          )

        if (graphData !== prevAttrs.graphData)
          graphComponent.render(graphData)
      },
    },
  )
}
