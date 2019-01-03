import * as html from '@hyperapp/html'

import {
  El,
  IGraphNodeData,
} from '@lib/types'

import './editor-component.css'

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
                actions.textEditor.setParentTextArea(el)
                actions.textEditor.setMirrorMarkEditor(mirrorMarkEditor)

                // Get the CodeMirror (editor) object.
                const codeMirrorEditor = mirrorMarkEditor.cm

                // Set the onChange event to capture input data.
                codeMirrorEditor.on('change', () => {
                  el.dispatchEvent(new Event('input'))
                })
              },
              oninput: () => {
                const codeMirrorEditor = state.textEditor.mirrorMarkEditor.cm
                actions.textEditor.setData(codeMirrorEditor.getValue())
              },
              ontextupdate: (ev: CustomEvent) => {
                const codeMirrorEditor = state.textEditor.mirrorMarkEditor.cm
                codeMirrorEditor.setValue(ev.detail.data)
              },
            },
          ),
        ],
      ),
    ],
  )
}
