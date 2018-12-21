import * as html from '@hyperapp/html'

export default function(
  content: string,
  oninput: (arg: string) => any,
  onClose: () => any,
) {
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
      html.textarea(
        {
          id: 'editor',
          oninput: (ev: Event) => {
            oninput((ev.target as HTMLTextAreaElement).value)
          },
          value: content,
        },
      ),
    ],
  )
}
