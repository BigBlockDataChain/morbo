import * as html from '@hyperapp/html'

import {
  IGraphNodeData,
} from '../types'

export default function(
  node: IGraphNodeData,
  state: any,
  actions: any,
  onClose: () => any,
) {
  if (node !== state.node) {
    actions.setNode(node)
    actions.textEditor.setData(null)
    actions.loadTextNote(node.id)
  }

  return html.div(
    {
      id: 'editor-container',
    },
    [
      html.button(
        {
          id: 'editor-close',
          onclick: (ev: Event) => onClose(),
        },
        'x',
      ),
      html.button(
        {
          disabled: true,
        },
        'save',
      ),
      html.div(node.title),
      html.div(node.tags.map(html.span)),
      html.textarea(
        {
          id: 'editor',
          oninput: (ev: Event) => {
            actions.textEditor.setData((ev.target as HTMLTextAreaElement).value)
          },
          value: state.textEditor.data,
        },
      ),
    ],
  )
}
