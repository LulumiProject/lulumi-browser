import os from 'os';
import { app, BrowserWindow, systemPreferences, protocol, ipcMain } from 'electron';
import menu from '../browser/menu';
import config from '../renderer/js/constants/config';

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
  ses.on('will-download', (event, item, webContents) => {
    const itemURL = item.getURL();
    if (item.getMimeType() === 'application/pdf'
      && itemURL.indexOf('blob:') !== 0
      && itemURL.indexOf('#pdfjs.action=download') === -1) {
      event.preventDefault();
      const qs = require('querystring');
      const param = qs.stringify({ file: itemURL });
      const PDFViewerURL = `file://${config.lulumiPDFJSPath}/web/viewer.html`;
      mainWindow.webContents.send('open-pdf', {
        location: `${PDFViewerURL}?${param}`,
        webContentsId: webContents.getId(),
      });
    } else {
      mainWindow.webContents.send('will-download-any-file', {
        webContentsId: webContents.getId(),
      });
    }
  });

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences) => {
    webPreferences.allowDisplayingInsecureContent = true;
    webPreferences.blinkfeatures = 'OverlayScrollbars';
    webPreferences.preload = `${config.lulumiAppPath}/pages/preload.js`;
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

if (process.env.NODE_ENV === 'development') {
  protocol.registerStandardSchemes(['lulumi']);
  app.on('ready', () => {
    protocol.registerHttpProtocol('lulumi', (request, callback) => {
      const url = request.url.substr((config.lulumiPagesCustomProtocol).length);
      const [type, param] = url.split('/');
      if (type === 'about') {
        if (param.indexOf('#') === 0) {
          // '#blablabla'
          callback({ url: `http://localhost:${require('../../../config').port}/about.html` });
        } else {
          // 'blablabla'
          callback({ url: `http://localhost:${require('../../../config').port}/${param}` });
        }
      }
    }, (error) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to register protocol');
      }
    });
    createWindow();
  });
} else {
  app.on('ready', () => {
    protocol.registerFileProtocol('lulumi', (request, callback) => {
      const url = request.url.substr((config.lulumiPagesCustomProtocol).length);
      const [type, param] = url.split('/');
      if (type === 'about') {
        if (param.indexOf('#') === 0) {
          // '#blablabla'
          callback({ path: `${__dirname}/about.html` });
        } else {
          // 'blablabla'
          callback({ path: `${__dirname}/${param}` });
        }
      }
    }, (error) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to register protocol');
      }
    });
    createWindow();
  });
}

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

ipcMain.on('lulumi-scheme-loaded', (event, val) => {
  const type = val.substr((config.lulumiPagesCustomProtocol).length).split('/')[0];
  const data = {};
  if (type === 'about') {
    const versions = process.versions;

    data.lulumi = [
      {
        key: 'Lulumi',
        value: app.getVersion(),
      },
      {
        key: 'Electron',
        value: versions.electron,
      },
      {
        key: 'Node',
        value: versions.node
      },
      {
        key: 'libchromiumcontent',
        value: versions.chrome,
      },
      {
        key: 'V8',
        value: versions.v8,
      },
      {
        key: 'os.platform',
        value: os.platform(),
      },
      {
        key: 'os.release',
        value: os.release(),
      },
      {
        key: 'os.arch',
        value: os.arch(),
      },
    ];
    data.preferences = [
      ['Search Engine Provider', 'search'],
    ];
    data.about = [
      [`${config.lulumiPagesCustomProtocol}about/#/about`, 'about'],
      [`${config.lulumiPagesCustomProtocol}about/#/lulumi`, 'lulumi'],
      [`${config.lulumiPagesCustomProtocol}about/#/preferences`, 'preferences'],
    ];
    global.sharedObject = {
      guestData: data,
    };
  }
});

ipcMain.on('guest-want-data', (event, val) => {
  switch(val) {
    case 'searchEngineProvider':
      mainWindow.webContents.send('get-search-engine-provider');
      ipcMain.on('give-search-engine-provider', (e, data) => {
        event.sender.send('guest-here-your-data', data);
      });
      break;
    default:
      break;
  }
});

ipcMain.on('set-current-search-engine-provider', (event, val) => {
  mainWindow.webContents.send('set-search-engine-provider', val);
  ipcMain.on('give-search-engine-provider', (e, data) => {
    event.sender.send('guest-here-your-data', data);
  });
});
