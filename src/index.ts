import {ipcRenderer} from 'electron'
import {app as hyperapp} from 'hyperapp'
import devtools from 'hyperapp-redux-devtools'

import {appActions, initialState, view} from './app'

import './index.css'

// @ts-ignore // no unused variables
const app = devtools(hyperapp)(
  initialState,
  appActions,
  view,
  document.querySelector('#root'),
)

if (process.env.NODE_ENV === 'PRODUCTION') {
  window.onbeforeunload = (e: Event) => {
    app.save()
    .catch(() => {
      alert('Failed to save. Click okay to shutdown anyway')
    })
    .finally(() => {
      ipcRenderer.send('app_quit')
      window.onbeforeunload = null
    })
  // Required by Chrome to prevent default
    e.returnValue = false
  }
}
