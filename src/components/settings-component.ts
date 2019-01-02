import * as html from '@hyperapp/html'

export default function(
    onClose: () => any,
) {
  return html.div(
    {
      id: 'settings-panel',
    },
    [
      html.div(
        {
          id: 'settings-close',
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
          id: 'settings-title',
        },
          'Settings',
      ),
      html.div(
        {
          id: 'settings-container',
        },
        [
          html.div(
            {
              id: 'checkbox-container',
            },
            [
              html.input(
                {
                  id: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
              html.input(
                {
                  id: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
              html.input(
                {
                  id: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
            ]
          ),
          html.div(
            {
              id: 'radio-container',
            },
            [
              html.input(
                {
                  id: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-radio',
                },
                'Option A',
              ),
              html.input(
                {
                  id: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-radio',
                },
                'Option B',
              ),
              html.input(
                {
                  id: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-radio',
                },
                'Option C',
              ),
              html.input(
                {
                  id: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  id: 'settings-label',
                  for: 'settings-radio',
                },
                'Option D',
              ),
            ]
          ),
          html.div(
            {
              id: 'selection-container',
            },
            [
              html.select(
                {
                  id: 'settings-select',
                },
                [
                  html.option(
                   'Select',
                  ),
                  html.option(
                   'Option A',
                  ),
                  html.option(
                   'Option B',
                  ),
                  html.option(
                   'Option C',
                  ),
                  html.option(
                   'Option D',
                  ),
                ],
              ),
              html.select(
                {
                  id: 'settings-select',
                },
                [
                  html.option(
                   'Select',
                  ),
                  html.option(
                   'Option A',
                  ),
                  html.option(
                   'Option B',
                  ),
                  html.option(
                   'Option C',
                  ),
                  html.option(
                   'Option D',
                  ),
                ],
              ),
              html.select(
                {
                  id: 'settings-select',
                },
                [
                  html.option(
                   'Select',
                  ),
                  html.option(
                   'Option A',
                  ),
                  html.option(
                   'Option B',
                  ),
                  html.option(
                   'Option C',
                  ),
                  html.option(
                   'Option D',
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}