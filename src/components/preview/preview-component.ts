import * as html from '@hyperapp/html'

import {
  IGraphNodeData,
  IPosition,
} from '@lib/types'

import './preview-component.css'

export function view(
  node: IGraphNodeData,
  position: IPosition,
) {
  return html.div(
    {
      id: 'preview-container',
      style: {
        top: position.y + 'px',
        left: position.x + 'px',
      },
    },
    [
      html.div(
        {
          class: 'preview-container-wrapper',
        },
        [
          html.div(
            {class: 'text-body note-title'},
            node.title,
          ),
          html.div(
            {class: 'text-body'},
            [
              html.label('Tags:'),
              node.tags.toString(),
            ],
          ),
          html.div(
            {class: 'text-body'},
            [
              html.label('Modified:'),
              node.lastModified.toString(),
            ],
          ),
        ],
      ),
    ],
  )
}
