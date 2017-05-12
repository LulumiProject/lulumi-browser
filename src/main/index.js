import { readFileSync, writeFile } from 'fs';
import os from 'os';
import path from 'path';
import { app, BrowserWindow, ipcMain, protocol, shell, systemPreferences } from 'electron';
import menu from './js/lib/menu';
import session from './js/lib/session';
import autoUpdater from './js/lib/auto-updater';
import config from '../renderer/js/constants/config';
import promisify from '../renderer/js/lib/promisify';
import * as lulumiExtension from '../api/lulumi-extension';

let mainWindow;

let shuttingDown = process.env.BABEL_ENV === 'test';
const storagePath = process.env.NODE_ENV === 'development'
  ? path.join(config.devUserData, 'lulumi-app-state')
  : path.join(app.getPath('userData'), 'app-state');
let appStateSaveHandler = null;

let setLanguage = false;
const langPath = process.env.NODE_ENV === 'development'
  ? path.join(config.devUserData, 'lulumi-lang')
  : path.join(app.getPath('userData'), 'lang');

const isDarwin = process.platform === 'darwin';
const swipeGesture = isDarwin ? systemPreferences.isSwipeTrackingFromScrollEventsEnabled() : false;

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : `file://${__dirname}/index.html`;

function appStateSave(force = false) {
  if (mainWindow) {
    mainWindow.webContents.send('request-app-state', force);
  }
}

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
  });

  mainWindow.loadURL(winURL);

  menu.init();
  session.webRequest();
  session.onWillDownload(mainWindow, config);
  session.setPermissionRequestHandler(mainWindow);
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.init();
    autoUpdater.listen(mainWindow);
  }

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    webPreferences.allowDisplayingInsecureContent = true;
    webPreferences.blinkfeatures = 'OverlayScrollbars';
    if (params.src.startsWith('lulumi-extension://')) {
      webPreferences.preload = `${config.lulumiHelperPath}/pages/extension-preload.js`;
    } else {
      webPreferences.preload = `${config.lulumiHelperPath}/pages/webview-preload.js`;
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
    if (setLanguage) {
      createWindow();
      setLanguage = false;
    }
  });

  ipcMain.on('request-lang', (event) => {
    let lang = null;
    try {
      lang = readFileSync(langPath, 'utf-8');
    // eslint-disable-next-line no-empty
    } catch (event) {
      lang = '"en"';
    }
    event.returnValue = JSON.parse(lang);
  });

  ipcMain.on('request-extension-objects', () => {
    global.backgroundPages = lulumiExtension.backgroundPages;
    global.manifestMap = lulumiExtension.manifestMap;
    mainWindow.webContents.send('response-extension-objects',
      lulumiExtension.manifestMap,
    );
    Object.keys(lulumiExtension.manifestMap).forEach((manifest) => {
      lulumiExtension.loadCommands(mainWindow, lulumiExtension.manifestMap[manifest]);
    });
  });

  ipcMain.on('request-app-state', () => {
    new Promise((resolve, reject) => {
      let data = null;
      try {
        data = readFileSync(storagePath, 'utf-8');
      // eslint-disable-next-line no-empty
      } catch (event) {}

      try {
        data = JSON.parse(data);
        resolve(data);
      } catch (event) {
        if (data) {
          reject();
          // eslint-disable-next-line no-console
          console.log(`could not parse data: ${data}, ${event}`);
        }
      }
    }).then((data) => {
      mainWindow.webContents.send('set-app-state', data);
    // eslint-disable-next-line no-console
    }).catch(() => console.log('request-app-state error'));
  });

  // save app-state every 5 mins
  appStateSaveHandler = setInterval(appStateSave, 1000 * 60 * 5);
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
          callback({ url: `http://localhost:${require('../../.electron-vue/config').port}/about.html` });
        } else {
          // 'blablabla'
          callback({ url: `http://localhost:${require('../../.electron-vue/config').port}/${param}` });
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
    if (setLanguage) {
      event.preventDefault();
      shuttingDown = false;
      mainWindow.close();
      return;
    }
    return;
  }
  event.preventDefault();
  clearInterval(appStateSaveHandler);
  appStateSaveHandler = null;
  appStateSave();
});

ipcMain.on('response-app-state', (event, data) => {
  if (data.ready) {
    promisify(writeFile, storagePath, JSON.stringify(data.newState))
      .then(() => {
        if (appStateSaveHandler === null) {
          shuttingDown = true;
          app.quit();
        }
      });
  } else {
    app.exit(0);
  }
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
          ? require('git-rev-sync').long('.')
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
      ['PDFViewer', 'pdfViewer'],
      ['Tab', 'tab'],
      ['Language', 'language'],
    ];
    data.about = [
      [`${config.lulumiPagesCustomProtocol}about/#/about`, 'about'],
      [`${config.lulumiPagesCustomProtocol}about/#/lulumi`, 'lulumi'],
      [`${config.lulumiPagesCustomProtocol}about/#/preferences`, 'preferences'],
      [`${config.lulumiPagesCustomProtocol}about/#/downloads`, 'downloads'],
      [`${config.lulumiPagesCustomProtocol}about/#/history`, 'history'],
      [`${config.lulumiPagesCustomProtocol}about/#/extensions`, 'extensions'],
    ];
    global.guestData = data;
  }
});

ipcMain.on('guest-want-data', (event, val) => {
  const webContentsId = event.sender.id;
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
    case 'pdfViewer':
      mainWindow.webContents.send('get-pdf-viewer', {
        webContentsId,
      });
      break;
    case 'tabConfig':
      mainWindow.webContents.send('get-tab-config', {
        webContentsId,
      });
      break;
    case 'lang':
      mainWindow.webContents.send('get-lang', {
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
  mainWindow.webContents.send('set-search-engine-provider', {
    val,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('set-homepage', (event, val) => {
  mainWindow.webContents.send('set-homepage', {
    val,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('set-pdf-viewer', (event, val) => {
  mainWindow.webContents.send('set-pdf-viewer', {
    val,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('set-tab-config', (event, val) => {
  mainWindow.webContents.send('set-tab-config', {
    val,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('set-lang', (event, val) => {
  mainWindow.webContents.send('request-permission', {
    webContentsId: event.sender.id,
    permission: 'setLanguage',
    lang: val.lang,
  });
  ipcMain.once(`response-permission-${event.sender.id}`, (event, data) => {
    if (data.accept) {
      mainWindow.webContents.send('set-lang', {
        val,
        webContentsId: event.sender.id,
      });
      promisify(writeFile, langPath, JSON.stringify(val.lang))
        .then(() => {
          setLanguage = true;
          app.quit();
        });
    }
  });
});
ipcMain.on('set-downloads', (event, val) => {
  mainWindow.webContents.send('set-downloads', {
    val,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('set-history', (event, val) => {
  mainWindow.webContents.send('set-history', {
    val,
    webContentsId: event.sender.id,
  });
});
