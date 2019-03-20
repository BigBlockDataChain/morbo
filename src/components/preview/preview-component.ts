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
        {class: 'text-body'},
        node.title,
      ),
      html.div(
        {class: 'text-body'},
        'Tags: ' + node.tags,
      ),
      html.div(
        {class: 'text-body'},
        'Type: ' + node.type,
      ),
      html.div(
        {class: 'text-body'},
        'Created: ' + node.created,
      ),
      html.div(
        {class: 'text-body'},
        'Last Modified: ' + node.lastModified,
      ),
    ],
  )
}
