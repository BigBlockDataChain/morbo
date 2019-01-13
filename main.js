const {BrowserWindow, app, ipcMain} = require('electron')
const url = require('url')

const {
  default: installExtension,
  REDUX_DEVTOOLS,
} = require('electron-devtools-installer');

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

function createWindow() {
  const win = new BrowserWindow({width: 1024, height: 600})
  const indexPath = url.format({
    protocol: 'http:',
    host: 'localhost:8080',
    pathname: 'index.html',
    slashes: true
  })
  win.loadURL(indexPath)

  if (process.env.NODE_ENV === 'PRODUCTION') {
    ipcMain.on('app_quit', (event, info) => {
      win.destroy()
    })
  }

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension: ${name}`))
    .catch((err) => console.warn('An error occurred:', err))
}
