import * as html from '@hyperapp/html'

import Empty from './widgets/empty'

const SEARCH_SVG = './res/magnifying-glass.svg'
const CLEAR_SVG = './res/cancel.svg'

interface IState {
  query: null | string
  results: any[]
}

export const state: IState = {
  query: null,
  results: [],
}

export const actions = {
  onInput: (value: string) => () => ({query: value}),
  searchResults: (results: any[]) => () => ({results}),
  clearSearch: () => () => ({query: null}),
}

export function view(
  _state: IState,
  _actions: any,
  onClose: () => void,
  performSearch: (query: string) => Promise<any>,
) {
  return html.div(
    {
      id: 'search',
    },
    [
      html.div(
        {
          class: 'search-input',
        },
        [
          html.img({class: 'search-icon', src: SEARCH_SVG}),
          html.input(
            {
              oncreate: (el: HTMLInputElement) => el.focus(),
              oninput: async (ev: Event) => {
                const value = (ev.target as HTMLInputElement).value
                _actions.onInput(value)
                _actions.searchResults(await performSearch(value))
              },
              value: _state.query,
            },
          ),
          html.img(
            {
              class: 'clear-icon',
              src: CLEAR_SVG,
              onclick: () => {
                _actions.clearSearch()
                onClose()
              },
            },
          ),
        ],
      ),
      _state.results.length > 0
        ? html.div(
            {
              class: 'result-container',
            },
            _state.results.map(result =>
              html.div(
                {
                  class: 'search-result',
                },
                result.title,
              ),
            ),
          )
        : Empty(),
    ],
  )
}
