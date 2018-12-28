import * as html from '@hyperapp/html'

const SEARCH_SVG = './res/magnifying-glass.svg'

export default function() {
  return html.div(
    {
      id: 'search',
    },
    [
      html.img({src: SEARCH_SVG}),
      html.input(),
    ],
  )
}
