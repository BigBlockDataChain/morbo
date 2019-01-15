import {
  IBoundingBox,
  IGraphChildParentIndex,
  IGraphIndex,
  IGraphMetadata,
  IGraphNodeData,
  ILinkTuple,
} from '@lib/types'
import {
  calculateLinearEquationFromPoints,
  flattenGraphIndex,
  graphMetadataToList,
  intersectLineWithRectange,
  makeChildParentIndex,
} from './graph-utils'

const index: IGraphIndex = {
  0: [1, 4],
  1: [],
  2: [3],
  4: [],
}

describe('makeChildParentIndex', () => {

  const cpIndex: IGraphChildParentIndex = {
    0: null,
    1: 0,
    2: null,
    3: 2,
    4: 0,
  }

  it('can make child parent index', () => {
    expect(makeChildParentIndex(index)).toEqual(cpIndex)
  })

})

describe('flattenGraphIndex', () => {

  const flatGraphIndex: ILinkTuple[] = [
    {id: '0-1', source: 0, target: 1},
    {id: '0-4', source: 0, target: 4},
    {id: '2-3', source: 2, target: 3},
  ]

  it('can flatten graph index to a list', () => {
    expect(flattenGraphIndex(index)).toEqual(flatGraphIndex)
  })

})

describe('graphMetadataToList', () => {

  const metadata: IGraphMetadata = {
    0: {
      id: 0,
      title: '0',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
    1: {
      id: 0,
      title: '1',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
    2: {
      id: 2,
      title: '2',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
  }

  const metadataList: IGraphNodeData[] = [
    {
      id: 0,
      title: '0',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
    {
      id: 0,
      title: '1',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
    {
      id: 2,
      title: '2',
      lastModified: '',
      created: '',
      x: 0,
      y: 0,
      tags: [],
    },
  ]

  it('can convert graph metadata to list', () => {
    expect(graphMetadataToList(metadata)).toEqual(metadataList)
  })

})

describe('intersectLineWithRectange', () => {

  const rect: IBoundingBox = {xMin: 0, yMin: 0, xMax: 10, yMax: 10}

  // it('can handle a line that does not leave the rectange (no intersection)', () => {
  //   const rect = {xMin: 50, yMin: 50, xMax: 100, yMax: 100}
  //   const line = {start: {x: 55, y: 55}, end: {x: 60, y: 60}}
  //   expect(intersectLineWithRectange(line, rect)).toBe(null)
  // })

  it('returns intersection at a top-left corner of rectange', () => {
    const line = {start: {x: 5, y: 5}, end: {x: -5, y: 15}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 0, y: 10})
  })

  it('returns intersection at a top-right corner of rectange', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 15, y: 15}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 10, y: 10})
  })

  it('returns intersection at a bottom-left corner of rectange', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 15, y: -5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 10, y: 0})
  })

  it('returns intersection at a bottom-right corner of rectange', () => {
    const line = {start: {x: 5, y: 5}, end: {x: -5, y: -5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 0, y: 0})
  })

  it('returns intersection at bottom edge of rectange (non vertical line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 10, y: -5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 7.5, y: 0})
  })

  it('returns intersection at top edge of rectange (non vertical line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 0, y: 15}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 2.5, y: 10})
  })

  it('returns intersection at bottom edge of rectange (vertical line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 5, y: -5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 5, y: 0})
  })

  it('returns intersection at top edge of rectange (vertical line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 5, y: 15}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 5, y: 10})
  })

  it('returns intersection at left edge of rectange (non horizontal line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: -5, y: 10}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 0, y: 7.5})
  })

  it('returns intersection at right edge of rectange (non horizontal line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 15, y: 0}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 10, y: 2.5})
  })

  it('returns intersection at left edge of rectange (horizontal line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: -5, y: 5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 0, y: 5})
  })

  it('returns intersection at right edge of rectange (horizontal line)', () => {
    const line = {start: {x: 5, y: 5}, end: {x: 15, y: 5}}
    expect(intersectLineWithRectange(line, rect)).toEqual({x: 10, y: 5})
  })

})

describe('calculateLinearEquationFromPoints', () => {

  it('returns slope and y-intersect for a non-vertical/non-horizontal line', () => {
    expect(calculateLinearEquationFromPoints({x: 2, y: 5}, {x: 0, y: 1}))
      .toEqual({m: 2, b: 1})
  })

  it('returns slope and y-intersect for a horizontal line', () => {
    expect(calculateLinearEquationFromPoints({x: 0, y: 5}, {x: 2, y: 5}))
      .toEqual({m: 0, b: 5})
  })

  it('returns slope of infinity only for a vertical line', () => {
    expect(calculateLinearEquationFromPoints({x: 0, y: 5}, {x: 0, y: 1}))
      .toEqual({m: Infinity})
  })

})
