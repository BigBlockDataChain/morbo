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
  focusedEl: number | null
  enterPressed: boolean
  keyPress: boolean
}

export const state: IState = {
  query: null,
  results: [],
  focusedEl: null,
  enterPressed: false,
  keyPress: false,
}

interface IActions {
  onInput: (value: string) => () => ActionResult<IState>,
  searchResults: (results: any[]) => () => void,
  clearSearch: () => () => ActionResult<IState>,
  onKeyPress: (ev: KeyboardEvent) => (_state: IState) => ActionResult<IState>,
  setFocusedEl: (value: number | null) => () => ActionResult<IState>,
}

const keymap = {
  UP: 38,
  DOWN: 40,
  ENTER: 13,
}

export const actions: IActions = {
  onInput: (value: string) => () => ({query: value}),
  searchResults: (results: any[]) => () => ({results}),
  clearSearch: () => () => ({query: null, results: []}),
  onKeyPress: (ev: KeyboardEvent) => (_state: IState) => {
    let nextFocusedEl = _state.focusedEl
    let pressed = false
    switch (ev.keyCode) {
      case keymap.UP:
        if (_state.focusedEl === null) nextFocusedEl = _state.results.length
        else nextFocusedEl = mod(_state.focusedEl - 1, _state.results.length)
        break
      case keymap.DOWN:
        if (_state.focusedEl === null) nextFocusedEl = 0
        else nextFocusedEl = mod(_state.focusedEl + 1, _state.results.length)
        break
      case keymap.ENTER:
        if (_state.focusedEl === null) break
        pressed = true
    }
    return ({focusedEl: nextFocusedEl, enterPressed: pressed, keyPress: true})
  },
  setFocusedEl: (value: number | null) => () => ({focusedEl: value, keyPress: false}),
}

export function view(
  _state: IState,
  _actions: IActions,
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
                _actions.setFocusedEl(null)
              },
              onkeydown: (event: KeyboardEvent) => {
                event.stopPropagation()
                _actions.onKeyPress(event)
              },
              value: _state.query,
            },
          ),
          html.div(
            {
              class: 'clear-icon',
              src: clearSvg,
              onclick: () => {
                (() => _actions.clearSearch())();
                (() => onClose())()
              },
            },
            [
              html.img({src: clearSvg}),
            ],
          ),
        ],
      ),
      // Results
      _state.results.length > 0
        ? html.div(
            {
              class: 'result-container',
              scrollTop: (_state.focusedEl && _state.keyPress) ?
                            _state.focusedEl * 60 : 0,
            },
            _state.results.map((result: any, i: number) => {
              const value = result.matches[0].value
              const formattedValue = value.length > 256
                ? value.substring(0, 256) + '...'
                : value
              return html.div(
                {
                  class: (_state.focusedEl === i) ?
                            'search-result-select' : 'search-result',
                  enterPressed: (_state.focusedEl === i && _state.enterPressed) ?
                                  (() => {
                                    onSearchResultClick(result.item.metadata)
                                    _actions.clearSearch()
                                    onClose()
                                  })() : false,
                  onclick: () => {
                    (() => onSearchResultClick(result.item.metadata))();
                    (() => _actions.clearSearch())();
                    (() => onClose())()
                  },
                  onmousemove: () => {_actions.setFocusedEl(i)},
                },
                [
                  html.div({class: 'search-result-title'}, result.item.metadata.title),
                  html.div({class: 'search-result-match'}, formattedValue),
                ],
              )
            }),
          )
        : Empty(),
    ],
  )
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
