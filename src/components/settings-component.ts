import * as html from '@hyperapp/html'

export default function(onClose: () => any) {
  return html.div(
    {
      id: 'settings-panel',
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
                  class: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
              html.input(
                {
                  class: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
              html.input(
                {
                  class: 'settings-checkbox',
                  type: 'checkbox',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-checkbox',
                },
                'Option Name',
              ),
            ],
          ),
          html.div(
            {
              class: 'radio-container',
            },
            [
              html.input(
                {
                  class: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-radio',
                },
                'Option A',
              ),
              html.input(
                {
                  class: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-radio',
                },
                'Option B',
              ),
              html.input(
                {
                  class: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-radio',
                },
                'Option C',
              ),
              html.input(
                {
                  class: 'settings-radio',
                  type: 'radio',
                  name: 'placeholder',
                },
              ),
              html.label(
                {
                  class: 'settings-label',
                  for: 'settings-radio',
                },
                'Option D',
              ),
            ],
          ),
          html.div(
            {
              class: 'selection-container',
            },
            [
              html.select(
                {
                  class: 'settings-select',
                },
                [
                  html.option('Select'),
                  html.option('Option A'),
                  html.option('Option B'),
                  html.option('Option C'),
                  html.option('Option D'),
                ],
              ),
              html.select(
                {
                  class: 'settings-select',
                },
                [
                  html.option('Select'),
                  html.option('Option A'),
                  html.option('Option B'),
                  html.option('Option C'),
                  html.option('Option D'),
                ],
              ),
              html.select(
                {
                  class: 'settings-select',
                },
                [
                  html.option('Select'),
                  html.option('Option A'),
                  html.option('Option B'),
                  html.option('Option C'),
                  html.option('Option D'),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}
