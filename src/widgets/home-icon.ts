import * as html from '@hyperapp/html'

export default function(onclick: Function) {
  return html.div(
    {
      class: 'home-icon',
      onclick: () => onclick(),
    },
  )
}
