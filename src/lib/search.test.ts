import search from './search'
import {IGraphMetadata} from './types'

const mockMetadata: IGraphMetadata = {
  1: {
    id: 1,
    title: 'One',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['tagA'],
  },
  2: {
    id: 2,
    title: 'Two',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['tagB'],
  },
  3: {
    id: 3,
    title: 'Three',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['tagC'],
  },
}

test('no results', () => {
  return expect(search(mockMetadata, 'foo')).resolves.toEqual([])
})

test('one result', () => {
  return search(mockMetadata, 'two').then((results: any) => {
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('Two')
  })
})

test('multiple results', () => {
  return search(mockMetadata, 'e').then((results: any) => {
    expect(results.length).toBe(2)
    expect(results[0].title).toBe('One')
    expect(results[1].title).toBe('Three')
  })
})
