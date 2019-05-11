const { app, BrowserWindow } = require('electron');

app.once('browser-window-created', (event, window) => {
  const preferences = window.webContents.getLastWebPreferences();
  preferences.contextIsolation = false;
  preferences.nodeIntegration = true;
  preferences.webviewTag = true;

  window.webContents.on('did-start-navigation', (event, url) => {
    event.preventDefault();
    const browserWindow = new BrowserWindow({
      show: !!window.webContents.browserWindowOptions.show,
      webPreferences: preferences
    });
    browserWindow.loadURL(url, {
      userAgent: 'Electron ' + process.versions.electron + ' (Node ' + process.versions.node + ')'
    });
    window.destroy();
  });
});
