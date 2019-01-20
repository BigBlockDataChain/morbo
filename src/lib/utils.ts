import {IPosition} from '@lib/types'

// tslint:disable:no-empty
export const emptyFunction = () => {}

export function assertNever(x: never): never {
  throw new Error(`unexpected object: ${x}`)
}

/**
 * Cartesian distance between two points
 */
export function cartesianDistance(a: IPosition, b: IPosition): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

export function clone(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}
