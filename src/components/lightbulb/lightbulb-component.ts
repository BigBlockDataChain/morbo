import * as html from '@hyperapp/html'

import './lightbulb-component.css'


export function view(
  onClose: () => any,
){
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
            'To create a new note: right mouse click on home screen -> "New Note"'
          ),
          html.div(
            'To edit an existing note: right mouse click on that note -> "Edit" OR double click the note'
          ),
          html.div(
            'To create a child node of an existing note: right mouse click on that note -> "New child note"'
          ),
          html.div(
            'To assign a parent note to a child note: right mouse click on the parent note -> "Make parent of"'
          ),
          html.div(
            'To set a note as home: right mouse that note -> "Set here as home"'
          ),
          html.div(
            'To place a note at the center of screen: right mouse click on that note -> "Center screen"'
          ),
          html.div(
            'To import/export a working environment: click the "Gear" button -> import/export'
          ),
          html.div(
            'Toggle dark theme: click the "Gear" button -> "Dark Theme"'
          ),
        ],
      ),
    ],
  )
}
