import * as html from '@hyperapp/html'

import './lightbulb-component.css'

export function view(
  onClose: () => any,
) {
  return html.div(
    {id: 'lightbulb-component'},
    [
      html.div(
        {
          id: 'lightbulb-modal',
        },
        [
          html.div(
            {class: 'lightbulb-close'},
            [
              html.button(
                {
                  class: 'close-button',
                  onclick: (ev: Event) => onClose(),
                },
                '⨯',
              ),
            ],
          ),
          html.div(
            {class: 'lightbulb-title'},
            'Do you know?',
          ),
          html.div(
            [
              html.br(),
              html.b('To create a new note:'),
              html.p('Right click on home screen -> "New Note"'),
              html.b('To edit an existing note:'),
              html.p('Right click the note -> "Edit" OR double click the note'),
              html.b('To create a child node of an existing note:'),
              html.p('Right click the note -> "New child note"'),
              html.b('To assign a parent note to a child note:'),
              html.p('Right click on the parent note -> "Make parent of"'),
              html.b('To set a note as home:'),
              html.p('Right click the note -> "Set here as home"'),
              html.b('To place a note at the center of screen:'),
              html.p('Right click the note -> "Center screen"'),
              html.b('To import/export a working environment:'),
              html.p('Click the "Gear" button -> import/export'),
              html.b('Toggle dark theme:'),
              html.p('Click the "Gear" button -> "Dark Theme"'),
              html.b('To edit the metadata tag and title of a note'),
              html.p('Open the note and click on "Tags" and "Title"'),
              html.b('To search a note by title or tags'),
              html.p('Click the "Magnifying-glass" button -> search'),
            ],
          ),
        ],
      ),
    ],
  )
}
