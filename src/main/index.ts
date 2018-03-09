import { Store } from 'vuex';
import { readdirSync, readFileSync, rename, writeFile } from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  shell,
  systemPreferences,
} from 'electron';
import collect from 'collect.js';
import unhandled from 'electron-unhandled';
import { is } from 'electron-util';

import autoUpdater from './js/lib/auto-updater';
import config from './js/constants/config';
import localshortcut from 'electron-localshortcut';
import menu from './js/lib/menu';
import promisify from './js/lib/promisify';
import request from './js/lib/request';

const { openProcessManager } = require('electron-process-manager');

const globalObjet = global as Lulumi.API.GlobalObject;

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
  storagePath = path.join(config.devUserData, 'app-state');
} else if (process.env.NODE_ENV === 'testing' || process.env.TEST_ENV === 'e2e') {
  storagePath = path.join(config.testUserData, 'app-state');
} else {
  storagePath = path.join(app.getPath('userData'), 'app-state');
}
let langPath: string;
if (process.env.NODE_ENV === 'development') {
  langPath = path.join(config.devUserData, 'lang');
} else if (process.env.NODE_ENV === 'testing' || process.env.TEST_ENV === 'e2e') {
  langPath = path.join(config.testUserData, 'lang');
} else {
  langPath = path.join(app.getPath('userData'), 'lang');
}

let appStateSaveHandler: any = null;
let setLanguage: boolean = false;

const isDarwin: boolean = is.macos;
const isWindows: boolean = is.windows;

const autoHideMenuBarSetting: boolean = isDarwin;
const swipeGesture: boolean = isDarwin
  ? systemPreferences.isSwipeTrackingFromScrollEventsEnabled()
  : false;

const winURL: string = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : `file://${__dirname}/index.html`;

// ./js/lib/session.ts
const session = require('./js/lib/session').default;

// ../shared/store/mainStore.ts
const mainStore = require('../shared/store/mainStore').default;
mainStore.register(storagePath, swipeGesture);
const store: Store<any> = mainStore.getStore();
const windows: Electron.BrowserWindow[] = mainStore.getWindows();

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
  const defaultOption: Object = {
    autoHideMenuBar: autoHideMenuBarSetting,
    frame: !isWindows,
    fullscreenWindowTitle: true,
    minWidth: 320,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
  };
  if (options && Object.keys(options).length !== 0) {
    mainWindow = new BrowserWindow(Object.assign({}, defaultOption, options));
  } else {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow(Object.assign({}, defaultOption, {
      width: 1080,
      height: 720,
    }));
  }

  mainWindow.loadURL(winURL);
  for (let index = 1; index < 9; index += 1) {
    localshortcut.register(mainWindow, `CmdOrCtrl+${index}`, () => {
      mainWindow.webContents.send('tab-click', index - 1);
    });
  }
  // register 'Escape' shortcut
  localshortcut.register(mainWindow, 'Escape', () => {
    mainWindow.webContents.send('escape-full-screen');
  });
  // special case: go to the last tab
  localshortcut.register(mainWindow, 'CmdOrCtrl+9', () => {
    mainWindow.webContents.send('tab-click', -1);
  });

  menu.init();

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // webPreferences.contextIsolation = true;
    // webPreferences.nativeWindowOpen = true;
    webPreferences.enableBlinkFeatures = 'OverlayScrollbars';

    const backgroundRegExp = new RegExp('^lulumi-extension://.+/\.*background\.*.html$');
    if (params.src.startsWith('lulumi-extension://')) {
      if (params.src.match(backgroundRegExp)) {
        webPreferences.preload = path.join(config.lulumiPreloadPath, 'extension-preload.js');
      } else {
        webPreferences.preload = path.join(config.lulumiPreloadPath, 'popup-preload.js');
      }
    } else {
      webPreferences.preload = path.join(config.lulumiPreloadPath, 'webview-preload.js');
    }
  });

  mainWindow.on('close', () => (mainWindow.removeAllListeners('will-attach-webview')));

  mainWindow.on('closed', () => {
    if (setLanguage) {
      setLanguage = false;
    }
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
        event.sender.send(eventName.substr(4), { url: 'about:newtab', follow: true });
      });
    };
  }
  return mainWindow;
}

// register createWindow method to BrowserWindow
(BrowserWindow as any).createWindow = createWindow;

// register 'lulumi://' and 'lulumi-extension://' as standard protocols that are secure
protocol.registerStandardSchemes(['lulumi', 'lulumi-extension'], { secure: true });
app.on('ready', () => {
  unhandled();
  // autoUpdater
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.init();
    autoUpdater.listen(windows);
  }
  // session related operations
  session.onWillDownload(windows, config.lulumiPDFJSPath);
  session.setPermissionRequestHandler(windows);
  session.registerScheme(config.lulumiPagesCustomProtocol);
  session.registerCertificateVerifyProc();
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
          x: window.left,
          y: window.top,
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
      store.dispatch('setAppState', data);
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
  if (!isDarwin) {
    app.quit();
  }
});

app.on('activate', () => {
  if (Object.keys(windows).length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event: Electron.Event) => {
  if (shuttingDown) {
    if (setLanguage) {
      event.preventDefault();
      shuttingDown = false;
      let bumpWindowIdsBy = 0;
      Object.values(windows).forEach((window) => {
        window.removeAllListeners('close');
        delete windows[window.id];
        (windows[window.id] as any) = -1;
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

// load windowProperties
ipcMain.on('get-window-properties', (event: Electron.Event) => {
  const windows: any[] = [];
  const baseDir = path.dirname(storagePath);
  const collection = collect(readdirSync(baseDir, 'utf8'));
  const windowProperties
    = collection.filter(v => (v.match(/app-state-window-\d+/) !== null));
  if (windowProperties.isNotEmpty()) {
    const windowPropertyFilenames = windowProperties.sort((a, b) => {
      return ((b.split('-') as any).pop() - (a.split('-') as any).pop());
    }).all();
    windowPropertyFilenames.forEach((windowPropertyFilename) => {
      const windowPropertyFile = path.join(baseDir, windowPropertyFilename);
      const windowProperty
        = JSON.parse(readFileSync(windowPropertyFile, 'utf8'));
      windowProperty.path = windowPropertyFile;
      windows.push(windowProperty);
    });
  }
  event.returnValue = windows;
});
// restore windowProperties
ipcMain.on('restore-window-property', (event: Electron.Event, windowProperty: any) => {
  let tmpWindow: Electron.BrowserWindow;

  const options: Electron.BrowserWindowConstructorOptions = {};
  const window = windowProperty.window;
  const windowState: string = window.state;
  options.width = window.width;
  options.height = window.height;
  options.x = window.left;
  options.y = window.top;

  tmpWindow = createWindow(options, (eventName) => {
    ipcMain.once(eventName, (event: Electron.Event) => {
      event.sender.send(eventName.substr(4), null);
      windowProperty.tabs.forEach((tab, index) => {
        tmpWindow.webContents.send(
          'new-tab', { url: tab.url, follow: index === windowProperty.currentTabIndex });
      });
      const windowPropertyFilename = path.basename(windowProperty.path);
      const windowPropertyTmp = path.resolve(app.getPath('temp'), windowPropertyFilename);
      rename(windowProperty.path, windowPropertyTmp, (renameError) => {
        if (renameError) {
          // tslint:disable-next-line:no-console
          console.error(renameError);
        }
      });
    });
  });
  if (window.focused) {
    tmpWindow.focus();
  }
  if (windowState === 'minimized') {
    tmpWindow.minimize();
  } else if (windowState === 'maximized') {
    tmpWindow.maximize();
  } else if (windowState === 'fullscreen') {
    tmpWindow.setFullScreen(true);
  }
});

// open ProcessManager
ipcMain.on('open-process-manager', () => {
  openProcessManager();
});

// return the number of BrowserWindow
ipcMain.on('get-window-count', (event: Electron.Event) => {
  event.returnValue = Object.keys(windows).length;
});

// return the number of BrowserWindow
ipcMain.on('show-certificate',
  (event: Electron.Event, certificate: Electron.Certificate, message: string) => {
    dialog.showCertificateTrustDialog(BrowserWindow.fromWebContents(event.sender), {
      certificate,
      message,
      // tslint:disable-next-line:align
    }, () => { });
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
  const data: Lulumi.Scheme.LulumiObject = {} as Lulumi.Scheme.LulumiObject;
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
  store.dispatch('setCurrentSearchEngineProvider', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-search-engine-provider', event.sender.id);
  });
});
ipcMain.on('set-homepage', (event: Electron.Event, val) => {
  store.dispatch('setHomepage', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-homepage', event.sender.id);
  });
});
ipcMain.on('set-pdf-viewer', (event: Electron.Event, val) => {
  store.dispatch('setPDFViewer', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-pdf-viewer', event.sender.id);
  });
});
ipcMain.on('set-tab-config', (event: Electron.Event, val) => {
  store.dispatch('setTabConfig', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-tab-config', event.sender.id);
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
      label: val.label,
    });
  });
  ipcMain.once(`response-permission-${eventOne.sender.id}`, (eventTwo: Electron.Event, data) => {
    if (data.accept) {
      store.dispatch('setLang', val);
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
  store.dispatch('setDownloads', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-downloads', event.sender.id);
  });
});
ipcMain.on('set-history', (event: Electron.Event, val) => {
  store.dispatch('setHistory', val);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('get-history', event.sender.id);
  });
});

// listen to new-lulumi-window event
ipcMain.on('new-lulumi-window', (event, data) => {
  if (data.url) {
    event.returnValue = createWindow({
      width: 800,
      height: 500,
      // tslint:disable-next-line:align
    }, (eventName) => {
      ipcMain.once(eventName, (event: Electron.Event) => {
        event.sender.send(eventName.substr(4), { url: data.url, follow: data.follow });
      });
    });
  }
});

// load the lang file
ipcMain.on('request-lang', (event: Electron.Event) => {
  let lang: string = '';
  try {
    lang = readFileSync(langPath, 'utf8');
  } catch (langError) {
    lang = '"en-US"';
    // tslint:disable-next-line:no-console
    console.log(langError);
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

ipcMain.on('fetch-search-suggestions',
  // tslint:disable-next-line:align
  (event: Electron.Event, provider: string, url: string, timestamp: number) => {
    request(provider, url, (result) => {
      event.sender.send(`fetch-search-suggestions-${timestamp}`, result);
    });
  });

// reload each BrowserView when we plug in our cable
globalObjet.isOnline = true;
ipcMain.on('online-status-changed', (event: Electron.Event, status: boolean) => {
  if (status) {
    if (!globalObjet.isOnline) {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('reload');
      });
      globalObjet.isOnline = true;
    }
  } else {
    globalObjet.isOnline = false;
  }
});
