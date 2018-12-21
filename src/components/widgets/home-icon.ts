import * as html from '@hyperapp/html'

export default function(onclick: () => any) {
  return html.div(
    {
      class: 'home-icon',
      onclick: () => onclick(),
    },
  )
}
