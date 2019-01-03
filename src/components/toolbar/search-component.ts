import * as html from '@hyperapp/html'
import {ActionResult} from 'hyperapp'

import {IGraphNodeData} from '@lib/types'
import Empty from '../widgets/empty'

const searchSvg = require('../../res/magnifying-glass.svg')
const clearSvg = require('../../res/cancel.svg')

import './search-component.css'

interface IState {
  query: null | string
  results: any[]
}

export const state: IState = {
  query: null,
  results: [],
}

interface IActions {
  onInput: (value: string) => () => ActionResult<IState>,
  searchResults: (results: any[]) => () => void,
  clearSearch: () => () => ActionResult<IState>,
}

export const actions: IActions = {
  onInput: (value: string) => () => ({query: value}),
  searchResults: (results: any[]) => () => ({results}),
  clearSearch: () => () => ({query: null, results: []}),
}

export function view(
  _state: IState,
  _actions: any,
  onClose: () => void,
  performSearch: (query: string) => Promise<any>,
  onSearchResultClick: (node: IGraphNodeData) => void,
) {
  return html.div(
    {
      id: 'search',
    },
    [
      // Input box
      html.div(
        {
          class: 'search-input',
        },
        [
          html.img({class: 'search-icon', src: searchSvg}),
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
              src: clearSvg,
              onclick: () => {
                (() => _actions.clearSearch())();
                (() => onClose())()
              },
            },
          ),
        ],
      ),
      // Results
      _state.results.length > 0
        ? html.div(
            {
              class: 'result-container',
            },
            _state.results.map(result =>
              html.div(
                {
                  class: 'search-result',
                  onclick: () => {
                    (() => onSearchResultClick(result))();
                    (() => _actions.clearSearch())();
                    (() => onClose())()
                  },
                },
                result.title,
              ),
            ),
          )
        : Empty(),
    ],
  )
}
