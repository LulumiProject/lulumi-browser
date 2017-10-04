import { readFileSync, writeFile } from 'fs';
import os from 'os';
import path from 'path';
import { app, BrowserWindow, ipcMain, protocol, shell, systemPreferences } from 'electron';

import autoUpdater from './js/lib/auto-updater';
import config from './js/constants/config';
import localshortcut from 'electron-localshortcut';
import menu from './js/lib/menu';
import promisify from './js/lib/promisify';
import session from './js/lib/session';

import { api, scheme } from 'lulumi';

const globalObjet = global as api.GlobalObject;

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  globalObjet.__static = path.resolve(__dirname, '../static');
}

let shuttingDown: boolean = (process.env.NODE_ENV === 'testing' || process.env.TEST_ENV === 'e2e');

let storagePath: string;
if (process.env.NODE_ENV === 'development') {
  storagePath = path.join(config.devUserData, 'lulumi-app-state');
} else if (process.env.NODE_ENV === 'testing' || process.env.TEST_ENV === 'e2e') {
  storagePath = path.join(config.testUserData, 'lulumi-app-state');
} else {
  storagePath = path.join(app.getPath('userData'), 'app-state');
}
let langPath: string;
if (process.env.NODE_ENV === 'development') {
  langPath = path.join(config.devUserData, 'lulumi-lang');
} else if (process.env.NODE_ENV === 'testing' || process.env.TEST_ENV === 'e2e') {
  langPath = path.join(config.testUserData, 'lulumi-lang');
} else {
  langPath = path.join(app.getPath('userData'), 'lang');
}

let appStateSaveHandler: any = null;
let setLanguage: boolean = false;

const isDarwin: boolean = process.platform === 'darwin';
const isWindows: boolean = process.platform === 'win32';

const autoHideMenuBarSetting: boolean = isDarwin;
const swipeGesture: boolean = isDarwin
  ? systemPreferences.isSwipeTrackingFromScrollEventsEnabled()
  : false;

const winURL: string = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : `file://${__dirname}/index.html`;

// ../shared/store/mainStore.ts
const mainStore = require('../shared/store/mainStore').default;
mainStore.register(storagePath, swipeGesture);
const windows = mainStore.getWindows();

// ../api/lulumi-extension.ts
const lulumiExtension = require('../api/lulumi-extension').default;

function appStateSave(soft: boolean = true): void {
  if (Object.keys(windows).length !== 0) {
    mainStore.saveAppState(soft)
      .then((state) => {
        if (state) {
          promisify(writeFile, storagePath, state).then(() => {
            if (appStateSaveHandler === null) {
              shuttingDown = true;
              app.quit();
            }
          });
        }
      });
  } else {
    shuttingDown = true;
    app.quit();
  }
}

// tslint:disable-next-line:max-line-length
function createWindow(options?: Electron.BrowserWindowConstructorOptions, callback?: Function): Electron.BrowserWindow {
  let mainWindow: Electron.BrowserWindow;
  if (options && Object.keys(options).length !== 0) {
    mainWindow = new BrowserWindow(options);
  } else {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
      width: 1080,
      height: 720,
      minWidth: 320,
      minHeight: 500,
      titleBarStyle: 'hiddenInset',
      fullscreenWindowTitle: true,
      autoHideMenuBar: autoHideMenuBarSetting,
      frame: !isWindows,
    });
  }

  mainWindow.loadURL(winURL);
  for (let index = 1; index < 9; index += 1) {
    localshortcut.register(mainWindow, `CmdOrCtrl+${index}`, () => {
      mainWindow.webContents.send('tab-click', index - 1);
    });
  }
  // special case: go to the last tab
  localshortcut.register(mainWindow, `CmdOrCtrl+9`, () => {
    mainWindow.webContents.send('tab-click', -1);
  });

  menu.init();

  // Session related operations
  session.registerScheme(config.lulumiPagesCustomProtocol);
  session.onWillDownload(mainWindow, config.lulumiPDFJSPath);
  session.setPermissionRequestHandler(mainWindow);

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.init();
    autoUpdater.listen(mainWindow);
  }

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // webPreferences.contextIsolation = true;
    webPreferences.nativeWindowOpen = true;
    webPreferences.blinkfeatures = 'OverlayScrollbars';

    const regexp = new RegExp('^lulumi-extension://.+/\.*background\.*.html$');
    if (params.src.startsWith('lulumi-extension://')) {
      if (params.src.match(regexp)) {
        webPreferences.preload = path.join(config.lulumiPreloadPath, 'extension-preload.js');
      } else {
        webPreferences.preload = path.join(config.lulumiPreloadPath, 'popup-preload.js');
      }
    } else {
      webPreferences.preload = path.join(config.lulumiPreloadPath, 'webview-preload.js');
    }
  });

  mainWindow.on('closed', () => {
    localshortcut.unregisterAll(mainWindow);
    if (setLanguage) {
      createWindow();
      setLanguage = false;
    }
    mainWindow.removeAllListeners('will-attach-webview');
    mainWindow.removeAllListeners('closed');
    (mainWindow as any) = null;
  });

  if (process.env.NODE_ENV !== 'testing' || process.env.TEST_ENV !== 'e2e') {
    // save app-state every 5 mins
    appStateSaveHandler = setInterval(appStateSave, 1000 * 60 * 5);
  }
  if (callback) {
    (mainWindow as any).callback = callback;
  } else {
    (mainWindow as any).callback = (eventName) => {
      ipcMain.once(eventName, (event: Electron.Event) => {
        event.returnValue = { url: 'about:newtab', follow: true };
      });
    };
  }
  return mainWindow;
}

// register createWindow method to BrowserWindow
(BrowserWindow as any).createWindow = createWindow;

// register 'lulumi://' and 'lulumi-extension://' as standard protocols
protocol.registerStandardSchemes(['lulumi', 'lulumi-extension']);
app.on('ready', () => {
  // register webRequest listeners
  session.registerWebRequestListeners();
  // load appState
  let data: string = '""';
  try {
    data = readFileSync(storagePath, 'utf8');
  } catch (readError) {
    // tslint:disable-next-line:no-console
    console.error(`could not read data from ${storagePath}, ${readError}`);
  }
  try {
    data = JSON.parse(data);
    if (data) {
      let tmpWindow: Electron.BrowserWindow;
      (data as any).windows.forEach((window) => {
        tmpWindow = createWindow({
          width: window.width,
          height: window.height,
          minWidth: 320,
          minHeight: 500,
          x: window.left,
          y: window.top,
          titleBarStyle: 'hiddenInset',
          fullscreenWindowTitle: true,
          autoHideMenuBar: autoHideMenuBarSetting,
          frame: !isWindows,
        });
        if (window.focused) {
          tmpWindow.focus();
        }
        if (window.windowState === 'minimized') {
          tmpWindow.minimize();
        } else if (window.windowState === 'maximized') {
          tmpWindow.maximize();
        } else if (window.windowState === 'fullscreen') {
          tmpWindow.setFullScreen(true);
        }
      });
      (data as any).windows = [];
      mainStore.dispatch(data);
    } else {
      createWindow();
    }
  } catch (parseError) {
    // tslint:disable-next-line:no-console
    console.error(`could not parse data from ${storagePath}, ${parseError}`);
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (Object.keys(windows).length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event) => {
  if (shuttingDown) {
    if (setLanguage) {
      event.preventDefault();
      shuttingDown = false;
      let bumpWindowIdsBy = 0;
      Object.values(windows).forEach((window) => {
        window.removeAllListeners('close');
        delete windows[window.id];
        windows[window.id] = -1;
        window.close();
        bumpWindowIdsBy += 1;
      });
      mainStore.bumpWindowIds(bumpWindowIdsBy);
      return;
    }
    Object.values(windows).forEach((window) => {
      window.removeAllListeners('close');
      delete windows[window.id];
    });
    return;
  }
  event.preventDefault();
  mainStore.windowStateSave();
  if (appStateSaveHandler !== null) {
    clearInterval(appStateSaveHandler);
    appStateSaveHandler = null;
  }
  appStateSave(false);
});

// return the number of BrowserWindow
ipcMain.on('get-window-count', (event: Electron.Event) => {
  event.returnValue = BrowserWindow.getAllWindows().length;
});

// set the title for the focused BrowserWindow
ipcMain.on('set-browser-window-title', (event, data) => {
  const window: Electron.BrowserWindow = windows[data.windowId];
  if (window) {
    window.setTitle(data.title);
  }
});

// show the item on host
ipcMain.on('show-item-in-folder', (event, path) => {
  if (path) {
    shell.showItemInFolder(path);
  }
});

// open the item on host
ipcMain.on('open-item', (event, path) => {
  if (path) {
    shell.openItem(path);
  }
});

// load preference things into global when users accessing 'lulumi://' protocol
ipcMain.on('lulumi-scheme-loaded', (event, val) => {
  const type: string = val.substr((config.lulumiPagesCustomProtocol).length).split('/')[0];
  const data: scheme.LulumiObject = {} as scheme.LulumiObject;
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
      {
        key: 'userData',
        value: process.env.NODE_ENV === 'development'
          ? config.devUserData
          : app.getPath('userData'),
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
    globalObjet.guestData = data;
  }
});

// about:* pages are eager to getting preference datas
ipcMain.on('guest-want-data', (event: Electron.Event, type: string) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    switch (type) {
      case 'searchEngineProvider':
        window.webContents.send('get-search-engine-provider', webContentsId);
        break;
      case 'homepage':
        window.webContents.send('get-homepage', webContentsId);
        break;
      case 'pdfViewer':
        window.webContents.send('get-pdf-viewer', webContentsId);
        break;
      case 'tabConfig':
        window.webContents.send('get-tab-config', webContentsId);
        break;
      case 'lang':
        window.webContents.send('get-lang', webContentsId);
        break;
      case 'downloads':
        window.webContents.send('get-downloads', webContentsId);
        break;
      case 'history':
        window.webContents.send('get-history', webContentsId);
        break;
      case 'extensions':
        break;
      default:
        break;
    }
  });
});

ipcMain.on('set-current-search-engine-provider', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-search-engine-provider', {
      val,
      webContentsId,
    });
  });
});
ipcMain.on('set-homepage', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-homepage', {
      val,
      webContentsId,
    });
  });
});
ipcMain.on('set-pdf-viewer', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-pdf-viewer', {
      val,
      webContentsId,
    });
  });
});
ipcMain.on('set-tab-config', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-tab-config', {
      val,
      webContentsId,
    });
  });
});
ipcMain.on('set-lang', (eventOne: Electron.Event, val) => {
  const webContentsId: number = eventOne.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('request-permission', {
      webContentsId,
      permission: 'setLanguage',
      lang: val.lang,
    });
  });
  ipcMain.once(`response-permission-${eventOne.sender.id}`, (eventTwo: Electron.Event, data) => {
    if (data.accept) {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('set-lang', {
          val,
          webContentsId: eventTwo.sender.id,
        });
      });
      promisify(writeFile, langPath, JSON.stringify(val.lang))
        .then(() => {
          setLanguage = true;
          menu.setLocale(val.lang);
          app.quit();
        });
    }
  });
});
ipcMain.on('set-downloads', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-downloads', {
      val,
      webContentsId,
    });
  });
});
ipcMain.on('set-history', (event: Electron.Event, val) => {
  const webContentsId: number = event.sender.id;
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('set-history', {
      val,
      webContentsId,
    });
  });
});

// listen to new-lulumi-window event
ipcMain.on('new-lulumi-window', (event, data) => {
  if (data.url) {
    createWindow({
      width: 800,
      height: 500,
      titleBarStyle: 'hiddenInset',
      fullscreenWindowTitle: true,
      autoHideMenuBar: autoHideMenuBarSetting,
      frame: !isWindows,
      // tslint:disable-next-line:align
    }, (eventName) => {
      ipcMain.once(eventName, (event: Electron.Event) => {
        event.returnValue = { url: data.url, follow: data.follow };
      });
    });
  }
});

// load the lang file
ipcMain.on('request-lang', (event) => {
  let lang: string = '';
  try {
    lang = readFileSync(langPath, 'utf8');
  } catch (event) {
    lang = '"en"';
  }
  event.returnValue = JSON.parse(lang);
});

// load extension objects for each BrowserWindow instance
ipcMain.on('request-extension-objects', (event: Electron.Event) => {
  // load persisted extensions
  lulumiExtension.loadExtensions();

  // assign extension objects to global variables
  globalObjet.backgroundPages = lulumiExtension.backgroundPages;
  globalObjet.manifestMap = lulumiExtension.manifestMap;

  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send(
      'response-extension-objects',
      lulumiExtension.manifestMap);
    Object.keys(lulumiExtension.manifestMap).forEach((manifest) => {
      lulumiExtension.loadCommands(window, lulumiExtension.manifestMap[manifest]);
    });
  });
});

// reload each BrowserView when we plug in our cable
globalObjet.online = true;
ipcMain.on('online-status-changed', (event: Electron.Event, status: boolean) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    if (status) {
      if (!globalObjet.online && status === true) {
        globalObjet.online = true;
        window.webContents.send('reload');
      }
    } else {
      globalObjet.online = false;
    }
  });
});
