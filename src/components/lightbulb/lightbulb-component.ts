import * as html from '@hyperapp/html'

import './lightbulb-component.css'

// interface IState {
//
// }
//
// export const state: IState = {
//
// }

export function view(
  _state: any,
  _actions: any,
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
        ],
      ),
    ],
  )
}
