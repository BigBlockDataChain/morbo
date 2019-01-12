import {basename} from 'path'

import {IGraphIndex, IGraphMetadata, NoteDataType} from '@lib/types'
import {
  loadIndex,
  loadMetadata,
  loadNote,
  writeIndex,
  writeMetadata,
  writeNote,
} from './io'
import {readFile, writeFile} from './io-utils'

jest.mock('./io-utils')

const textContent = 'hello\nworld'

const mockIndex: IGraphIndex = {
  1: [2, 3],
  2: [],
  3: [4, 5],
  4: [],
  5: [],
}

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
}

beforeEach(() => {
  jest.resetAllMocks()
})

describe('loadIndex', () => {
  test('can load index', async () => {
    (readFile as any).mockImplementation(
      (path: string) => Promise.resolve(JSON.stringify(mockIndex)),
    )
    expect(await loadIndex()).toEqual(mockIndex)
  })

  test('returns empty index when reading fails', async () => {
    (readFile as any).mockImplementation(
      (path: string) => Promise.reject('Failed to read file'),
    )
    expect(await loadIndex()).toEqual({})
  })
})

describe('writeIndex', () => {
  test('can write index', async () => {
    (writeFile as any).mockImplementation(
      (path: string, data: string) => Promise.resolve(),
    )
    expect(await writeIndex(mockIndex)).toBe(undefined)
    const filename = basename((writeFile as any).mock.calls[0][0])
    expect(filename).toBe('index')
    expect((writeFile as any).mock.calls[0][1]).toBe(JSON.stringify(mockIndex))
  })
})

describe('loadMetadata', () => {
  test('can load metadata', async () => {
    (readFile as any).mockImplementation(
      (path: string) => Promise.resolve(JSON.stringify(mockMetadata)),
    )
    expect(await loadMetadata()).toEqual(mockMetadata)
  })

  test('returns empty metadata when reading fails', async () => {
    (readFile as any).mockImplementation(
      (path: string) => Promise.resolve('Failed to read file'),
    )
    expect(await loadMetadata()).toEqual({})
  })
})

describe('writeMetadata', () => {
  test('can write index', async () => {
    (writeFile as any).mockImplementation(
      (path: string, data: string) => Promise.resolve(),
    )
    expect(await writeMetadata(mockMetadata)).toBe(undefined)
    const filename = basename((writeFile as any).mock.calls[0][0])
    expect(filename).toBe('metadata')
    expect((writeFile as any).mock.calls[0][1]).toBe(JSON.stringify(mockMetadata))
  })
})

describe('loadNote', () => {

  test('can load text note', async () => {
    (readFile as any).mockImplementation(
      (path: string) => Promise.resolve(textContent),
    )
    expect(await loadNote(1, NoteDataType.TEXT)).toBe(textContent)
    const filename = basename((readFile as any).mock.calls[0][0])
    expect(filename).toBe('file1.txt')
  })
})

describe('writeNote', () => {
  test('can write text note', async () => {
    (writeFile as any).mockImplementation(
      (path: string, data: string) => Promise.resolve(),
    )
    expect(await writeNote(1, NoteDataType.TEXT, textContent)).toBe(undefined)
    const filename = basename((writeFile as any).mock.calls[0][0])
    expect(filename).toBe('file1.txt')
    expect((writeFile as any).mock.calls[0][1]).toBe(textContent)
  })
})
