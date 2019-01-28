import * as html from '@hyperapp/html'

import './settings-component.css'

interface IState {
  darkTheme: boolean,
}

export const state: IState = {
  darkTheme: false,
}

export const actions = {
  toggleDarkTheme: () => (_state: IState) => ({darkTheme: !_state.darkTheme}),
}

export function view(onClose: () => any, _state: any, _actions: any) {
  return html.div(
    {
      id: 'settings-component',
    },
    [
      html.div(
        {
          class: 'settings-close',
        },
        [
          html.button(
            {
              onclick: (ev: Event) => onClose(),
            },
            'x',
          ),
        ],
      ),
      html.div(
        {
          class: 'settings-title',
        },
        'Settings',
      ),
      html.div(
        {
          class: 'settings-container',
        },
        [
          html.div(
            {
              class: 'checkbox-container',
            },
            [
              html.input(
                {
                  class: 'switch',
                  type: 'checkbox',
                  checked: _state.darkTheme,
                },
              ),
              // html.label('Dark Theme',),
              html.label(
                {
                  for: 'switch',
                  onclick: (ev: Event) => _actions.toggleDarkTheme(),
                },
              ),
            ],
          ),
        ],
      ),
    ],
  )
}
