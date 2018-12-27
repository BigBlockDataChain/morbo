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
        node.tags.map(html.span),
      ),
      html.div(
        {
          id: 'text-edit-tools',
        },
        [
          html.button(
            {
              disabled: true,
            },
            'B',
          ),
          html.button(
            {
              disabled: true,
            },
            'I',
          ),
          html.button(
            {
              disabled: true,
            },
            'U',
          ),
          html.select(
            {
              disabled: false,
            },
            [
              html.option(
                {
                  disabled: false,
                },
                'Body',
             ),
             html.option(
               {
                 disabled: false,
               },
               'Heading 1',
             ),
             html.option(
               {
                 disabled: false,
               },
               'Heading 2',
             ),
             html.option(
               {
                 disabled: false,
               },
               'Heading 3',
             ),
            ],
          ),
          html.button(
            {
              disabled: true,
            },
            '</>',
          ),
        ],
      ),
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
