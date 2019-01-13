import {
  IGraphMetadata,
  IGraphChildParentIndex,
  IGraphIndex,
  IGraphNodeData,
  ILinkTuple,
} from '@lib/types'
import {
  makeChildParentIndex,
  graphMetadataToList,
  flattenGraphIndex,
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
