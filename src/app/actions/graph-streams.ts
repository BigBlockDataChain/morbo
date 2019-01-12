import {Subject} from 'rxjs'

import {
  GraphAction,
  GraphCommand,
} from '@components/graph/types'

export const graphActionStream = new Subject<GraphAction>()
export const graphActionObservable = graphActionStream.asObservable()
export const graphCommandStream = new Subject<GraphCommand>()
export const graphCommandObservable = graphCommandStream.asObservable()
