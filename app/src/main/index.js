

import { app, BrowserWindow, systemPreferences } from 'electron';
import menu from '../browser/menu';

let mainWindow;
const isDarwin = process.platform === 'darwin';
const swipeGesture = isDarwin ? systemPreferences.isSwipeTrackingFromScrollEventsEnabled() : false;

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 720,
    width: 1080,
    minWidth: 320,
    minHeight: 500,
    titleBarStyle: 'hidden-inset',
    autoHideMenuBar: true,
    frame: true,
  });

  mainWindow.loadURL(winURL);

  menu.init();

  const ses = mainWindow.webContents.session;
  ses.on('will-download', (event, item) => {
    if (item.getMimeType() === 'application/pdf') {
      event.preventDefault();
      const qs = require('querystring');
      const param = qs.stringify({ file: item.getURL() });
      const location = process.env.NODE_ENV === 'development'
        ? `file://${__dirname}/../../pdfjs/web/viewer.html?${param}`
        : `file://${__dirname}/../pdfjs/web/viewer.html?${param}`;
      mainWindow.webContents.send('will-download', location);
    }
  });

  mainWindow.on('scroll-touch-begin', () => {
    mainWindow.webContents.send('scroll-touch-begin', swipeGesture);
  });

  mainWindow.on('scroll-touch-end', () => {
    mainWindow.webContents.send('scroll-touch-end');
  });

  mainWindow.on('scroll-touch-edge', () => {
    mainWindow.webContents.send('scroll-touch-edge');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // eslint-disable-next-line no-console
  console.log('mainWindow opened');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
