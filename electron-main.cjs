const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'public/logo192.png')
  });

  // Clear WebView cache
  win.webContents.session.clearCache().then(() => {
    // In production, load the web app
    if (app.isPackaged) {
      win.loadURL('https://app.mizanbill.com/login');
    } else {
      // In development, load the dev server
      win.loadURL('http://localhost:3000/login');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
