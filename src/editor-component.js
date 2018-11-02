import * as html from '@hyperapp/html'

export default function() {
  const state = {
    content: 'hello world',
  }

  const actions = {
    oncreate: el => state => {
      el.value = state.content
    },

    oninput: value => state =>
      ({...state, content: value}),
  }

  function view(state, actions) {
    return html.div(
      {
        id: 'editor-container',
      },
      [
        html.textarea(
          {
            id: 'editor',
            // oncreate: ev => actions.oncreate(ev),
            oninput: ev => actions.oninput(ev.target.value),
            value: state.content,
          }
        ),
      ]
    )
  }

  function setContent(state, content) {
    return {...state, content}
  }

  return {state, actions, view, setContent}
}
