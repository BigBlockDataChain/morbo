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
              id: 'text-editor',
              oncreate: (el: El) => {
                const mirrorMarkOptions = {
                  showToolbar: true,
                }
                const mirrorMarkEditor = (window as any).mirrorMark(el, mirrorMarkOptions)
                mirrorMarkEditor.render()

                // Get the CodeMirror (editor) object.
                const codeMirrorEditor = mirrorMarkEditor.cm

                // Set the onChange event to capture input data.
                codeMirrorEditor.on('change', () => {
                  const textEditor = (document as any).getElementById('text-editor')
                  textEditor.dispatchEvent(new Event('input'))
                })
              },
              oninput: () => {
                // Navigate the DOM to find the text box containing user text.
                const editorDiv = (document as any).getElementById('editor')
                const textarea = editorDiv.childNodes[2].childNodes[0].childNodes[0]

                actions.textEditor.setData(textarea.value)
              },
              value: state.textEditor.data,
            },
          ),
        ],
      ),
    ],
  )
}
