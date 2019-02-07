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

window.onbeforeunload = (e: Event) => {
  app.save()
    .catch(() => {
      alert('Failed to save. Click okay to shutdown anyway')
    })
    .finally(() => {
      ipcRenderer.send('app_quit')

      // Remove event handler to prevent recursion
      window.onbeforeunload = null

      // If the app_quit event causes window to get destroyed, production works as
      // expected. If during development a reload is expected, then it works as expected
      //
      // But as a result in development only way to shutdown the app is by interrupting
      // the process in the shell or by killing the process by some other means.
      location.reload()
    })

  // Required by Chrome to prevent default
  e.returnValue = false
}
