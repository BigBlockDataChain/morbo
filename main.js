const {BrowserWindow, app, ipcMain} = require('electron')

const {
  default: installExtension,
  REDUX_DEVTOOLS,
} = require('electron-devtools-installer');

let win = null

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar to stay active
  // until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin')
    app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the dock icon is
  // clicked and there are no other windows open.
  if (win === null)
    createWindow()
})

function createWindow() {
  win = new BrowserWindow({width: 1024, height: 600})
  win.loadFile('./index.html')

  win.on('closed', () => {
    win = null
  })

  if (process.env.NODE_ENV === 'PRODUCTION') {
    ipcMain.on('app_quit', (event, info) => {
      win.destroy()
  })}

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension: ${name}`))
    .catch((err) => console.warn('An error occurred:', err))
}
