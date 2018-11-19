import * as html from '@hyperapp/html'

export default function() {
  const state = {
    mode: 'min',
  }

  const actions = {
    toggleMode: () => state =>
      ({mode: state.mode === 'min' ? 'max' : 'min'}),
  }

  function view(state, actions, globalState) {
    return html.div(
      {
        id: 'debug-panel',
      },
      [
        html.div(
          {
            'id': 'debug-panel-header',
            onclick: () => actions.toggleMode(),
          },
          'State',
        ),
        state.mode === 'min' ? undefined : html.div(
          {
            id: 'debug-panel-body',
            style: {
              display: 'flex',
              flexDirection: 'column',
            },
          },
          [
            html.pre(JSON.stringify(globalState, null, 2)),
          ],
        ),
      ],
    )
  }

  return {state, actions, view}
}
