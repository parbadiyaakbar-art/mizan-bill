const { app, BrowserWindow, Menu } = require('electron');
Menu.setApplicationMenu(null);
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Mizan Bill',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'public/Mizan_Bill_3D_Icon.ico')
  });

  
    // In production, load the web app
    if (app.isPackaged) {
      win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      // In development, load the dev server
      win.loadURL('http://localhost:3000/login');
    }
  
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
