import * as html from '@hyperapp/html'

import Search from './search-component'

const SVG_ICONS = {
  BACK: './res/back.svg',
  HOME: './res/house.svg',
  SETTINGS: './res/settings.svg',
  SEARCH: './res/magnifying-glass.svg',
  SAVE: './res/save-disk.svg',
}

export default function({
  onBack,
  onHome,
  onSave,
  onSettings,
}: {
  onBack: () => void,
  onHome: () => void,
  onSave: () => void,
  onSettings: () => void,
}) {
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
        {class: 'container'},
        [
          // icon(SVG_ICONS.SEARCH),
          Search(),
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
