import Fuse from 'fuse.js'
import {ActionResult} from 'hyperapp'

import {loadNote} from '@lib/io'
import {getLogger} from '@lib/logger'
import {NoteDataType, SearchResults} from '@lib/types'
import {clone} from '@lib/utils'
import {GraphNodeId, IGraphMetadata} from './types'

const logger = getLogger('lib/search')

interface IFileCache {
  [id: number]: string
}

interface IState {
  fileCache: IFileCache
  cacheSize: number
  resultsCache: {query: string, results: SearchResults}
}

export const state: IState = {
  fileCache: {},
  cacheSize: 0,
  resultsCache: {query: '', results: []},
}

interface IActions {
  updateFileCache: ({id, data}: {id: GraphNodeId, data: string}) =>
    (_state: IState, _actions: IActions) => ActionResult<IState>

  search: ({metadata, query}: {metadata: IGraphMetadata, query: string}) =>
    (_state: IState, _actions: IActions) => Promise<SearchResults>

  _updateResultsCache: ({query, results}: {query: string, results: SearchResults}) =>
    () => ActionResult<IState>
}

export const actions: IActions = {
  search: ({metadata, query}: {metadata: IGraphMetadata, query: string}) =>
    (_state: IState, _actions: IActions) => {
      if (query.toLowerCase() === _state.resultsCache.query)
        return Promise.resolve(clone(_state.resultsCache))

      return new Promise(async resolve => {
        const results = await _search(
          _state.fileCache, metadata, query, _actions.updateFileCache)

        // TODO: Very expensive clone
        _actions._updateResultsCache({query, results: clone(results)})
        resolve(results)
      })
    },

  updateFileCache: ({id, data}: {id: GraphNodeId, data: string}) =>
    (_state: IState, _actions: IActions) => {
      return {
        fileCache: {
          ..._state.fileCache,
          [id]: data,
        },
      }
    },

  _updateResultsCache: ({query, results}: {query: string, results: SearchResults}) =>
    () => {
      return {
        resultsCache: {query, results},
      }
    },
}

async function _search(
  fileCache: IFileCache,
  metadata: IGraphMetadata,
  query: string,
  updateFileCache: ({id, data}: {id: GraphNodeId, data: string}) => void,
): Promise<SearchResults> {
  if (query.trim() === '') return []

  const data: Array<{metadata: any, data: string}> = []

  const fileLoadingPromises = Object.keys(metadata)
    .map(Number)
    .map((id: GraphNodeId): Promise<void> => {
      if (fileCache[id] === undefined)
        return loadNote(id, NoteDataType.TEXT)
          .then((fileData: string) => {
            setTimeout(() => updateFileCache({id, data: fileData}))
            data.push({metadata: metadata[id], data: fileData})
          })
          .catch(err => {
            logger.warn('Failed to load note', id, err)
            data.push({metadata: metadata[id], data: ''})
          })

      data.push({metadata: metadata[id], data: fileCache[id]})
      return Promise.resolve()
    })

  // Wait for all data to be loaded
  await Promise.all(fileLoadingPromises)

  const MAX_QUERY_LEN = 32

  const options = {
    shouldSort: true,
    includeMatches: true,
    threshold: 0.3,
    location: 0,
    distance: 100000,
    maxPatternLength: MAX_QUERY_LEN,
    minMatchCharLength: 1,
    keys: [
      'data',
      'metadata.title',
      'metadata.tags',
    ],
  }

  return new Fuse(data as any, options).search(query.substring(0, MAX_QUERY_LEN).trim())
}
