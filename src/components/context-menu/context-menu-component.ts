import * as html from '@hyperapp/html'

import {getLogger} from '@lib/logger'

import './context-menu-component.css'

const logger = getLogger('main')

export const state = {
  menuOpen: false,
}

export const actions = {
  toggleMenu: ({menuOpen: !state.menuOpen}),
}

export function view(
  _state: any,
  _actions: any,
  items: Map<string, () => void> = new Map([
    ['New text node', function onItem1() {logger.log('item 1 clicked')}],
    ['New handwritten node', function onItem2() {logger.log('item 2 clicked')}],
    ['Delete node', function onItem3() {logger.log('item 3 clicked')}],
  ]),
) {
  return html.div({
    id: 'context-menu',
    display: 'none',
  }, [
    html.ul(menuBuilder(items)),
  ])
}

function menuBuilder(items: Map<string, () => void>) {
  const itemList = []
  for (const [description, callback] of items) {
    itemList.push(html.li([
      html.button({onclick: callback}, description),
    ]))
  }
  return itemList
}
