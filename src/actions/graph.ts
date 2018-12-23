import {
  loadIndex,
  loadMetadata,
} from '../io/io'

export const actions: any = {
  init: () => async (_: any, _actions: any) => {
    const loadIndexPromise = loadIndex()
    const loadMetadataPromise = loadMetadata()

    await Promise.all([
      loadIndexPromise,
      loadMetadataPromise,
    ])

    const index = await loadIndexPromise
    const metadata = await loadMetadataPromise

    _actions.setGraphData({
      index,
      metadata,
    })
  },

  setGraphData: (graph: any) => () => {
    return graph
  },
}
