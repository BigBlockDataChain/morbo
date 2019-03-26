import {remote} from 'electron'

import * as html from '@hyperapp/html'

import './settings-component.css'

const dialog = remote.dialog

interface IState {
  darkTheme: boolean,
}

export const state: IState = {
  darkTheme: false,
}

export const actions = {
  toggleDarkTheme: () => (_state: IState) => ({darkTheme: !_state.darkTheme}),

  onImportDirectoryClick: (importDirectory: (path: string) => any) => () => {
    dialog.showOpenDialog(
      {properties: ['openDirectory']},
      (paths: string[]) => importDirectory(paths[0]),
    )
  },
  onExportDataClick: (exportData: (path: string) => any) => () => {
    dialog.showOpenDialog(
      {properties: ['openDirectory']},
      (paths: string[]) => exportData(paths[0]),
    )
  },
}

export function view(
  _state: any,
  _actions: any,
  onClose: () => any,
  importDirectory: (path: string) => any,
  exportData: (path: string) => any,
) {
  const themeSwitch = html.div(
    {class: 'item'},
    [
      html.label(
        {class: 'theme-label'},
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
  )

  const importExport = html.div(
    {class: 'item'},
    [
      html.label('Notes'),
      html.button(
        {onclick: () => _actions.onImportDirectoryClick(importDirectory)},
        'Import',
      ),
      html.button(
        {onclick: () => _actions.onExportDataClick(exportData)},
        'Export',
      ),
    ],
  )

  return html.div(
    {id: 'settings-component'},
    [
      html.div(
        {
          id: 'settings-modal',
        },
        [
          html.div(
            {class: 'settings-close'},
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
            {class: 'settings-title'},
            'Settings',
          ),
          html.div(
            {class: 'settings-container'},
            [
              themeSwitch,
              importExport,
            ],
          ),
        ],
      ),
    ],
  )
}
