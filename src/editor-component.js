import * as html from '@hyperapp/html'

export default function(content, oninput, onClose) {
  return html.div(
    {
      id: 'editor-container',
    },
    [
      html.button(
        {
          id: 'editor-close',
          onclick: ev => onClose(),
        },
        'x'
      ),
      html.textarea(
        {
          id: 'editor',
          oninput: ev => {
            oninput(ev.target.value)
          },
          value: content,
        }
      ),
    ]
  )
}
