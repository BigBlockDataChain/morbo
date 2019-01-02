import * as html from '@hyperapp/html'
import classNames from 'classnames'

import {IGraphNodeData} from '../types'
import * as Search from './search-component'

const backSvg = require('../res/back.svg')
const homeSvg = require('../res/house.svg')
const settingSvg = require('../res/settings.svg')
const searchSvg = require('../res/magnifying-glass.svg')
const saveSvg = require('../res/save-disk.svg')

const SVG_ICONS = {
  BACK: backSvg,
  HOME: homeSvg,
  SETTINGS: settingSvg,
  SEARCH: searchSvg,
  SAVE: saveSvg,
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
    onSearchResultClick,
  }: {
    onBack: () => void,
    onHome: () => void,
    onSave: () => void,
    onSettings: () => void,
    onSearchResultClick: (node: IGraphNodeData) => void,
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
              onSearchResultClick,
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
