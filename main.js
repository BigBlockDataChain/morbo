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

  win.setMenuBarVisibility(false)
  win.setAutoHideMenuBar(true)

  const indexPath = url.format({
    protocol: 'http:',
    host: 'localhost:8080',
    pathname: 'index.html',
    slashes: true
  })
  win.loadURL(indexPath)


  ipcMain.on('app_quit', (event, info) => {
    // NOTE: To allow reloading in development, the only way to shutdown in development is
    // by killing the process from the shell
    if ((process.env.NODE_ENV || 'development').toLowerCase() === 'production') {
      win.destroy()
    }
  })

  ipcMain.on('ondragstart', (event, filePath) => {
    readFile(filePath)

    function readFile(filepath){
      fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err){
          alert("An error occured reading the file: " + err.message)
          return
        }
        event.sender.send('fileData', data)
      })
    }
  })
  // ipcMain.on('ondragstart', (event, filePath) => {
  //   event.sender.send({
  //     file: filePath
  //   })
  // })

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension: ${name}`))
    .catch((err) => console.warn('An error occurred:', err))
}
