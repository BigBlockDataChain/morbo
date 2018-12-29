import * as html from '@hyperapp/html'
import classNames from 'classnames'

import * as Search from './search-component'

const SVG_ICONS = {
  BACK: './res/back.svg',
  HOME: './res/house.svg',
  SETTINGS: './res/settings.svg',
  SEARCH: './res/magnifying-glass.svg',
  SAVE: './res/save-disk.svg',
}

interface IState {
  search: any
  searchOpen: boolean,
}

export const state = {
  search: Search.state,
  searchOpen: false,
}

export const actions = {
  search: Search.actions,

  toggleSearch: () => (_state: IState) => ({searchOpen: !_state.searchOpen}),
}

export function view(
  _state: IState,
  _actions: any,
  {
    onBack,
    onHome,
    onSave,
    onSettings,
  }: {
    onBack: () => void,
    onHome: () => void,
    onSave: () => void,
    onSettings: () => void,
  },
  performSearch: (query: string) => Promise<void>,
) {
  return html.div(
    {
      id: 'toolbar',
    },
    [
      html.div(
        {class: 'container'},
        [
          icon(onBack, SVG_ICONS.BACK),
          icon(onHome, SVG_ICONS.HOME),
          icon(onSave, SVG_ICONS.SAVE),
          icon(onSettings, SVG_ICONS.SETTINGS),
        ],
      ),
      html.div(
        {class: classNames('container', {'search-open': _state.searchOpen})},
        [
          _state.searchOpen
          ? Search.view(
              _state.search,
              _actions.search,
              _actions.toggleSearch,
              performSearch,
            )
          : icon(_actions.toggleSearch, SVG_ICONS.SEARCH),
        ],
      ),
    ],
  )
}

function icon(onClick: () => void, imgSrc: string) {
  return html.div(
    {
      class: 'icon',
      onclick: () => onClick(),
    },
    [
      html.img(
        {
          src: imgSrc,
        },
      ),
    ],
  )
}
