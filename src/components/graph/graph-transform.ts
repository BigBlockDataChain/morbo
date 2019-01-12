/*
 * TODO
 * Convert graph transform type of {x, y, scale} or something similar to the existing type
 */

import {getLogger} from '@lib/logger'

const logger = getLogger('graph-transform')

const _GRAPH_TRANSFORMATION_LOCAL_STORAGE_KEY = 'graphTransformation'
const _DEFAULT_TRANSFORM: GraphTransformType = [0, 0, 1]

type TransformX = number
type TransformY = number
type TransformScale = number
export type GraphTransformType = [TransformX, TransformY, TransformScale]

let lastTransform: null | GraphTransformType = null

/**
 * If local storage does not have a graph transformation, set it to a default value
 */
export function initializeGraphTransform() {
  const localGraphTransform = window.localStorage
    .getItem(_GRAPH_TRANSFORMATION_LOCAL_STORAGE_KEY)

  if (localGraphTransform === null || localGraphTransform.match(/NaN/)) {
    logger.debug(
      'Graph transform not get. Initializing to default value of', _DEFAULT_TRANSFORM)
    window.localStorage
      .setItem(_GRAPH_TRANSFORMATION_LOCAL_STORAGE_KEY, _DEFAULT_TRANSFORM.join(' '))
  }
}

/**
 * Get graph transformation from local storage
 */
export function getGraphTransform(): GraphTransformType | null {
  if (lastTransform !== null) return lastTransform

  const result = window.localStorage.getItem(_GRAPH_TRANSFORMATION_LOCAL_STORAGE_KEY)
  return result !== null
    ? result.split(' ').map(Number) as GraphTransformType
    : null
}

/**
 * Update local storage with up to date graph transformation
 */
export function updateGraphTransform(transform: GraphTransformType): void {
  const transformString = transform.join(' ')

  if (lastTransform !== null && lastTransform.join(' ') === transformString)
    return

  lastTransform = transform
  window.localStorage
    .setItem(_GRAPH_TRANSFORMATION_LOCAL_STORAGE_KEY, transform.join(' '))
}
