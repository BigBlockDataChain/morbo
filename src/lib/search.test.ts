import search from './search'
import {IGraphMetadata} from './types'

const mockMetadata: IGraphMetadata = {
  1: {
    id: 1,
    title: 'File One',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['alpha', 'gamma'],
  },
  2: {
    id: 2,
    title: 'Important File Two',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['beta'],
  },
  3: {
    id: 3,
    title: 'Important File Three',
    lastModified: '',
    created: '',
    x: 12,
    y: 12,
    tags: ['charlie', 'gamma'],
  },
}

describe('title', () => {

  test('no results', () => {
    return expect(search(mockMetadata, 'foo')).resolves.toEqual([])
  })

  test('one result', () => {
    return search(mockMetadata, 'File two').then((results: any) => {
      expect(results.length).toBe(1)
      expect(results[0].title).toBe(mockMetadata[2].title)
    })
  })

  test('multiple results', () => {
    return search(mockMetadata, 'Important File').then((results: any) => {
      expect(results.length).toBe(2)
      expect(results[0].title).toBe(mockMetadata[2].title)
      expect(results[1].title).toBe(mockMetadata[3].title)
    })
  })

})

describe('tags', () => {

  test('no results', () => {
    return expect(search(mockMetadata, 'delta')).resolves.toEqual([])
  })

  test('one result', () => {
    return search(mockMetadata, 'alpha').then((results: any) => {
      expect(results.length).toBe(1)
      expect(results[0].title).toBe(mockMetadata[1].title)
    })
  })

  test('multiple results', () => {
    return search(mockMetadata, 'gamma').then((results: any) => {
      expect(results.length).toBe(2)
      expect(results[0].title).toBe(mockMetadata[1].title)
      expect(results[1].title).toBe(mockMetadata[3].title)
    })
  })

})
