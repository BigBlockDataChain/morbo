import * as html from '@hyperapp/html'

import {
  El,
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
      html.div(
        {
          id: 'editor-right-buttons',
        },
        [
          html.button(
            {
              disabled: true,
            },
            'delete',
          ),
          html.button(
            {
              disabled: true,
            },
            'edit',
          ),
          html.button(
            {
              disabled: true,
            },
            'maximize',
          ),
        ],
      ),
      html.div(
        {
          id: 'editor-title',
        },
        node.title,
      ),
      html.div(
        {
          id: 'editor-tags',
        },
        [
          html.div(
            [
              node.tags.map(html.span),
              html.button(
                {
                  disabled: true,
                },
                '+',
              ),
            ],
          ),
        ],
      ),
      html.div(
        {
          id: 'editor',
        },
        [
          html.textarea(
            {
              oncreate: (el: El) => {
                const mm = (window as any).mirrorMark(el, {showToolbar: true})
                mm.render()
              },
              // Does not work currently with mirror mark editor
              oninput: (ev: Event) => {
                actions.textEditor.setData((ev.target as HTMLTextAreaElement).value)
              },
              // Does not work currently with mirror mark editor
              value: state.textEditor.data,
            },
          ),
        ],
      ),
    ],
  )
}
