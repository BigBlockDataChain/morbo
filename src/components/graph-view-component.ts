import * as html from '@hyperapp/html'
import {fromEvent, Observable, Subject} from 'rxjs'
import {debounceTime} from 'rxjs/operators'

import {
  El,
  IDimensions,
  IGraphData,
} from '../types'
import GraphComponent from './graph/graph'
import {GraphAction} from './graph/types'

const graphComponent = new GraphComponent()

export default function(
  dimensions: IDimensions,
  onHomeClick: () => any,
  graphData: IGraphData,
  graphActionStream: Subject<GraphAction>,
  onGraphResize: (el: El) => any,
  sizeCalculationRequiredStream: Observable<void>,
) {
  return html.div(
    {
      id: 'graph-view-component',
      oncreate: (el: El) => {
        onGraphResize(el)
        fromEvent(window, 'resize')
          .pipe(debounceTime(200))
          .subscribe(() => onGraphResize(el))
        sizeCalculationRequiredStream.subscribe(() => {
          onGraphResize(el)
        })
      },
    },
    [
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

        if (
          !prevAttrs.graphData
          || graphData.index !== prevAttrs.graphData.index
          || !prevAttrs.metdata
          || graphData.metadata !== prevAttrs.graphData.metadata
        )
          graphComponent.render(graphData)
      },
    },
  )
}
