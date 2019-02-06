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
              class: 'close-button',
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
              html.label(
                {
                  class: 'theme-label',
                },
                'Dark Theme',
              ),
              html.input(
                {
                  class: 'switch',
                  type: 'checkbox',
                  checked: _state.darkTheme,
                },
              ),
              html.label(
                {
                  for: 'switch',
                  class: 'toggle-switch',
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
