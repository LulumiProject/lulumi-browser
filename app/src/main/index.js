import fs from 'fs';
import os from 'os';
import path from 'path';
import { app, BrowserWindow, systemPreferences, protocol, ipcMain, shell } from 'electron';
import menu from '../browser/menu';
import config from '../renderer/js/constants/config';
import promisify from '../renderer/js/lib/promisify';

let mainWindow;

let shuttingDown = false;
const storagePath = process.env.NODE_ENV === 'development'
  ? path.join(process.env.HOME, '.lulumi-test-app-state')
  : path.join(app.getPath('userData'), 'app-state');

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
      const totalBytes = item.getTotalBytes();
      const startTime = item.getStartTime();
      mainWindow.webContents.send('will-download-any-file', {
        webContentsId: webContents.getId(),
        name: item.getFilename(),
        url: item.getURL(),
        totalBytes,
        isPaused: item.isPaused(),
        canResume: item.canResume(),
        startTime,
        state: 'init',
      });

      ipcMain.on('pause-downloads-progress', (event, remoteStartTime) => {
        if (startTime === remoteStartTime) {
          item.pause();
        }
      });
      ipcMain.on('resume-downloads-progress', (event, remoteStartTime) => {
        if (startTime === remoteStartTime) {
          item.resume();
        }
      });
      ipcMain.on('cancel-downloads-progress', (event, remoteStartTime) => {
        if (startTime === remoteStartTime) {
          item.cancel();
        }
      });

      item.on('updated', (event, state) => {
        mainWindow.webContents.send('update-downloads-progress', {
          startTime: item.getStartTime(),
          getReceivedBytes: item.getReceivedBytes(),
          savePath: item.getSavePath(),
          isPaused: item.isPaused(),
          canResume: item.canResume(),
          state,
        });
      });

      item.on('done', (event, state) => {
        ipcMain.removeAllListeners([
          'pause-downloads-progress',
          'resume-downloads-progress',
          'cancel-downloads-progress',
        ]);
        mainWindow.webContents.send('complete-downloads-progress', {
          name: item.getFilename(),
          startTime: item.getStartTime(),
          state,
        });
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

  new Promise((resolve, reject) => {
    let data = null;
    try {
      data = fs.readFileSync(storagePath, 'utf-8');
    } catch(event) {}

    try {
      data = JSON.parse(data);
      resolve(data);
    } catch (event) {
      if (data) {
        console.log(`could not parse data: ${data}, ${event}`);
      }
    }
  }).then((data) => {
    setTimeout(() => {
      mainWindow.webContents.send('set-app-state', data);
    }, 3000);
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

app.on('before-quit', (event) => {
  if (shuttingDown) {
    return;
  }
  event.preventDefault();
  mainWindow.webContents.send('request-app-state');
});

ipcMain.on('response-app-state', (event, data) => {
  if (data.ready) {
    promisify(fs.writeFile, storagePath, JSON.stringify(data.newState))
      .then(() => {
        shuttingDown = true;
        app.quit();
      });
  } else {
    app.exit(0);
  }
  setTimeout(() => {
    app.exit(0);
  }, 3000);
});

ipcMain.on('show-item-in-folder', (event, path) => {
  if (path) {
    shell.showItemInFolder(path);
  }
});

ipcMain.on('open-item', (event, path) => {
  if (path) {
    shell.openItem(path);
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
        key: 'rev',
        value: process.env.NODE_ENV === 'development'
          ? require('git-rev-sync').long()
          : config.lulumiRev,
      },
      {
        key: 'Electron',
        value: versions.electron,
      },
      {
        key: 'Node',
        value: versions.node,
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
      ['Homepage', 'homepage'],
      ['Tab', 'tab'],
    ];
    data.about = [
      [`${config.lulumiPagesCustomProtocol}about/#/about`, 'about'],
      [`${config.lulumiPagesCustomProtocol}about/#/lulumi`, 'lulumi'],
      [`${config.lulumiPagesCustomProtocol}about/#/preferences`, 'preferences'],
      [`${config.lulumiPagesCustomProtocol}about/#/downloads`, 'downloads'],
      [`${config.lulumiPagesCustomProtocol}about/#/history`, 'history'],
      [`${config.lulumiPagesCustomProtocol}about/#/extensions`, 'extensions'],
    ];
    global.sharedObject = {
      guestData: data,
    };
  }
});

ipcMain.on('guest-want-data', (event, val) => {
  const webContentsId = event.sender.getId();
  switch (val) {
    case 'searchEngineProvider':
      mainWindow.webContents.send('get-search-engine-provider', {
        webContentsId,
      });
      break;
    case 'homepage':
      mainWindow.webContents.send('get-homepage', {
        webContentsId,
      });
      break;
    case 'tabConfig':
      mainWindow.webContents.send('get-tab-config', {
        webContentsId,
      });
      break;
    case 'downloads':
      mainWindow.webContents.send('get-downloads', {
        webContentsId,
      });
      break;
    case 'history':
      mainWindow.webContents.send('get-history', {
        webContentsId,
      });
      break;
    case 'extensions':
      break;
    default:
      break;
  }
});

ipcMain.on('set-current-search-engine-provider', (event, val) => {
  mainWindow.webContents.send('set-search-engine-provider', val);
});

ipcMain.on('set-homepage', (event, val) => {
  mainWindow.webContents.send('set-homepage', val);
});

ipcMain.on('set-tab-config', (event, val) => {
  mainWindow.webContents.send('set-tab-config', val);
});

ipcMain.on('set-downloads', (event, val) => {
  mainWindow.webContents.send('set-downloads', val);
});

ipcMain.on('set-history', (event, val) => {
  mainWindow.webContents.send('set-history', val);
});
