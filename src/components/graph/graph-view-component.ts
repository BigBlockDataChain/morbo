import * as html from '@hyperapp/html'
import {fromEvent, Observable, Subject} from 'rxjs'
import {debounceTime} from 'rxjs/operators'

import {
  El,
  IDimensions,
  IGraphData,
} from '@lib/types'
import GraphComponent from './graph'
import {GraphAction, GraphCommand} from './types'

const graphComponent = new GraphComponent()

export default function(
  dimensions: IDimensions,
  onHomeClick: () => any,
  graphData: IGraphData,
  graphActionStream: Subject<GraphAction>,
  onGraphResize: (el: El) => any,
  sizeCalculationRequiredStream: Observable<void>,
  graphCommandStream: Observable<GraphCommand>,
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
      d3Container(dimensions, graphData, graphActionStream, graphCommandStream),
    ],
  )
}

function d3Container(
  dimensions: IDimensions,
  graphData: IGraphData,
  graphActionStream: Subject<GraphAction>,
  graphCommandStream: Observable<GraphCommand>,
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
          graphCommandStream,
        )
        graphComponent.render(dimensions, graphData)
      },
      onupdate: (el: El, prevAttrs: any) => {
        graphComponent.init(
          el,
          {height: dimensions.height, width: dimensions.width},
          graphActionStream,
          graphCommandStream,
        )
        graphComponent.render(dimensions, graphData)
      },
    },
  )
}
