import * as html from '@hyperapp/html'

export const state = {
  menuOpen: false,
}

export const actions = {
  toggleMenu: ({menuOpen: !state.menuOpen})
}

export function view(
  state: any,
  actions: any,
  items: Map<string, () => void> = new Map([
    ['New text node', function onItem1(){console.log('item 1 clicked')}],
    ['New handwritten node', function onItem2(){console.log('item 2 clicked')}],
    ['Delete node', function onItem3(){console.log('item 3 clicked')}]
  ]),
) {
  return html.div({
    id: 'right-click-menu',
    display: 'none',
  }, [
    html.ul(menuBuilder(items))
  ])
}

function menuBuilder(items: Map<string, () => void>) {
  let itemList = []
  for (const [description, callback] of items) {
    itemList.push(html.li([
      html.button({onclick: callback}, description)
    ]))
  }
  return itemList
}
