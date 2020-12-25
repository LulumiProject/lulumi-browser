/* eslint-disable max-len */
/* eslint-disable no-console */

import Vue from 'vue';
import Vuex from 'vuex';
import { BrowserWindow, ipcMain } from 'electron';
import { is } from 'electron-util';
import { writeFile } from 'fs';

import { actions } from './actions';
import { getters } from './getters';
import modules from './modules';

import promisify from '../../main/lib/promisify';
import urlUtil from '../../renderer/lib/url-util';

Vue.use(Vuex);

const isDarwin: boolean = is.macos;
const isWindows: boolean = is.windows;
const isLinux: boolean = is.linux;

const globalObject = global as Lulumi.API.GlobalObject;

const windows: Electron.BrowserWindow[] = [];

const broadcastMutations = (store) => {
  store.subscribe((mutation) => {
    Object.keys(windows).forEach((key) => {
      const id = parseInt(key, 10);
      if (typeof windows[id] !== 'number') {
        windows[id].webContents.send('vuex-apply-mutation', mutation);
      } else {
        delete windows[id];
      }
    });
  });
};

const store = new Vuex.Store({
  actions,
  getters,
  modules,
  plugins: [broadcastMutations],
  strict: process.env.NODE_ENV !== 'production',
});

function handleWindowProperty(window: Electron.BrowserWindow, action: string) {
  const bounds: Electron.Rectangle = window.getBounds();
  let windowState = 'normal';
  if (window.isFullScreen()) {
    windowState = 'fullscreen';
  } else if (window.isMaximized()) {
    windowState = 'maximized';
  } else if (window.isMinimized()) {
    windowState = 'minimized';
  }
  if (action === 'create') {
    store.dispatch('createWindow', {
      windowId: window.id,
      width: bounds.width,
      height: bounds.height,
      left: bounds.x,
      top: bounds.y,
      windowState,
      type: (window.webContents as any).getType(),
    });
  } else if (action === 'update') {
    store.dispatch('updateWindowProperty', {
      windowId: window.id,
      width: bounds.width,
      height: bounds.height,
      left: bounds.x,
      top: bounds.y,
      focused: window.isFocused(),
      windowState,
    });
  }
}

function windowsOrdering(bumpWindowIdsBy: number, oneWindow = -1): Lulumi.Store.LulumiBrowserWindowProperty[] {
  const newWindows: Lulumi.Store.LulumiBrowserWindowProperty[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  if (oneWindow !== -1) {
    const id = oneWindow;
    const oldWindows: Lulumi.Store.LulumiBrowserWindowProperty[] = store.getters.windows;
    const value: Lulumi.Store.LulumiBrowserWindowProperty | undefined = oldWindows.find(window => window.id === id);
    if (value !== undefined) {
      const tmp: Lulumi.Store.LulumiBrowserWindowProperty = Object.assign({}, value);
      tmp.id = windowId;
      newWindows.push(tmp);
    }
  } else {
    Object.keys(windows).forEach((key) => {
      const id = parseInt(key, 10);
      const oldWindows: Lulumi.Store.LulumiBrowserWindowProperty[] = store.getters.windows;
      const value: Lulumi.Store.LulumiBrowserWindowProperty | undefined = oldWindows.find(window => window.id === id);
      if (value !== undefined) {
        const tmp: Lulumi.Store.LulumiBrowserWindowProperty = Object.assign({}, value);
        tmp.id = windowId;
        newWindows.push(tmp);
        windowId += 1;
      }
    });
  }
  return newWindows;
}

const tabsMapping = (tabs: Lulumi.Store.TabObject[], tabsOrder: number[]): number[] => {
  const newOrder: number[] = [];
  for (let index = 0; index < tabs.length; index += 1) {
    if (tabsOrder) {
      newOrder[index] = !tabsOrder.includes(index)
        ? index
        : tabsOrder.indexOf(index);
    } else {
      newOrder[index] = index;
    }
  }
  return newOrder;
};

function tabsOrdering(newStart: number, bumpWindowIdsBy: number, oneWindow = -1): Lulumi.Store.TabsOrdering {
  let newTabId: number = newStart;
  let newTabs: Lulumi.Store.TabObject[] = [];
  const newCurrentTabIndexes: number[] = [0];
  let windowId: number = bumpWindowIdsBy === 0
    ? 1
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  if (oneWindow !== -1) {
    const tmpTabs: Lulumi.Store.TabObject[] = [];
    const id = oneWindow;
    const currentTabIndex: number = store.getters.currentTabIndexes[id];
    const oldTabs: Lulumi.Store.TabObject[] =
      store.getters.tabs.filter(tab => (tab.windowId === id));
    const tabsOrder: number[] = tabsMapping(oldTabs, store.getters.tabsOrder[id]);
    oldTabs.forEach((_, index) => {
      tmpTabs.push(Object.assign({}, oldTabs[tabsOrder[index]]));
    });
    tmpTabs.forEach((tab) => {
      newTabId += 1;
      tab.id = newTabId;
      tab.windowId = windowId;
      if (tab.url.startsWith('about:')) {
        tab.url = urlUtil.getUrlFromInput(tab.url);
      }
      if (tab.url.startsWith('lulumi-extension:')) {
        tab.url = urlUtil.getUrlFromInput('about:newtab');
      }
      Object.keys(tab.extensionsMetadata).forEach((key) => {
        if (store.getters.extensionInfoDict[key] === undefined) {
          delete tab.extensionsMetadata[key];
        }
      });
    });
    newTabs = tmpTabs;
    newCurrentTabIndexes[windowId] = !tabsOrder.includes(currentTabIndex)
      ? currentTabIndex
      : tabsOrder.indexOf(currentTabIndex);
  } else {
    Object.keys(windows).forEach((key) => {
      const tmpTabs: Lulumi.Store.TabObject[] = [];
      const id = parseInt(key, 10);
      const window = windows[id];
      if (window.getTitle() !== 'command-palette') {
        const currentTabIndex: number = store.getters.currentTabIndexes[id];
        const oldTabs: Lulumi.Store.TabObject[] =
          store.getters.tabs.filter(tab => tab.windowId === id);
        const tabsOrder: number[] = tabsMapping(oldTabs, store.getters.tabsOrder[id]);
        oldTabs.forEach((_, index) => {
          tmpTabs.push(Object.assign({}, oldTabs[tabsOrder[index]]));
        });
        tmpTabs.forEach((tab) => {
          newTabId += 1;
          tab.id = newTabId;
          tab.windowId = windowId;
          if (tab.url.startsWith('about:')) {
            tab.url = urlUtil.getUrlFromInput(tab.url);
          }
          if (tab.url.startsWith('lulumi-extension:')) {
            tab.url = urlUtil.getUrlFromInput('about:newtab');
          }
          Object.keys(tab.extensionsMetadata).forEach((key2) => {
            if (store.getters.extensionInfoDict[key2] === undefined) {
              delete tab.extensionsMetadata[key2];
            }
          });
        });
        newTabs = newTabs.concat(tmpTabs);
        newCurrentTabIndexes[windowId] = !tabsOrder.includes(currentTabIndex)
          ? currentTabIndex
          : tabsOrder.indexOf(currentTabIndex);
        windowId += 1;
      }
    });
  }
  return {
    tabObjects: newTabs,
    currentTabIndexes: newCurrentTabIndexes,
  };
}

function saveWindowState(windowId: number): Promise<any> {
  const { tabObjects: newTabs, currentTabIndexes: newCurrentTabIndexes } =
    tabsOrdering(0, 0, windowId);
  const newWindows = windowsOrdering(0, windowId);
  return Promise.resolve({
    amount: newTabs.length,
    tabs: newTabs,
    currentTabIndex: newCurrentTabIndexes[1],
    window: newWindows[0],
  });
}

const register = (storagePath: string, swipeGesture: boolean): void => {
  ipcMain.on('vuex-connect', (event: Electron.IpcMainEvent) => {
    let close = false;
    const window = BrowserWindow.fromWebContents(event.sender);
    // command-palette window
    if (window === null || event.sender.getURL().endsWith('cp.html#/')) {
      windows[globalObject.commandPalette.id] = globalObject.commandPalette;
      (globalObject.commandPalette as BrowserWindow).on('close', (event2: Electron.IpcMainEvent) => {
        if (close) {
          close = false;
        } else {
          event2.preventDefault();

          delete windows[globalObject.commandPalette.id];
          close = true;
          globalObject.commandPalette.close();
        }
      });
    } else {
      const windowId = window.id;

      // we've registered this window, so we just return
      if (windows[windowId] !== undefined) {
        event.returnValue = store.state;
        return;
      }

      (window as any).setMaxListeners(0);

      window.on('blur', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('focus', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('maximize', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('unmaximize', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('minimize', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('restore', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('resize', () => {
        handleWindowProperty(window, 'update');
      });
      window.on('move', () => {
        handleWindowProperty(window, 'update');
      });

      if (isWindows || isLinux) {
        window.on('app-command', (_, command) => {
          if (command === 'browser-backward') {
            window.webContents.send('go-back');
          } else if (command === 'browser-forward') {
            window.webContents.send('go-forward');
          }
        });
      }

      window.on('scroll-touch-begin', () => {
        window.webContents.send('scroll-touch-begin', swipeGesture);
      });
      window.on('scroll-touch-end', () => {
        window.webContents.send('scroll-touch-end');
      });
      window.on('scroll-touch-edge', () => {
        window.webContents.send('scroll-touch-edge');
      });

      window.on('enter-full-screen', () => {
        window.webContents.send('enter-full-screen', isDarwin);
      });
      window.on('leave-full-screen', () => {
        window.webContents.send('leave-full-screen', isDarwin);
      });

      ipcMain.on(`window-${window.id}-set-bounds`, (event2, bounds) => {
        const browserView = window.getBrowserView();

        if (browserView) {
          browserView.setBounds({
            x: 0,
            y: 72,
            width: bounds.width,
            height: bounds.height - /* nav */ 72 - /* status-bar */ 22,
          });
        }
      });

      window.webContents.executeJavaScript(`
        function triggerResize() {
          const width = document.body.offsetWidth
          const height = document.body.offsetHeight;
          require('electron')
            .ipcRenderer.send('window-${window.id}-set-bounds', {
              width,
              height,
            });
        }
        triggerResize();
        const ResizeSensor = require('css-element-queries/src/ResizeSensor');
        new ResizeSensor(document.getElementById("app"), triggerResize);
      `);

      ipcMain.on('window-id', (event2: Electron.IpcMainEvent) => {
        const window2 = BrowserWindow.fromWebContents(event2.sender);
        if (window2) {
          event2.returnValue = {
            windowId: window2.id,
            windowWebContentsId: window2.webContents.id,
          };
        }
      });

      (window as any).callback(`any-new-tab-suggestion-for-window-${windowId}`);

      window.on('close', () => {
        if (close) {
          close = false;

          // only the commandPalette left
          if (Object.keys(windows).length === 1) {
            globalObject.commandPalette.close();
          }
        } else {
          event.preventDefault();

          // store the properties of this window
          handleWindowProperty(window, 'update');

          if (process.env.NODE_ENV !== 'test') {
            saveWindowState(windowId).then((state) => {
              if (state && state.amount > 1) {
                promisify(writeFile, `${storagePath}-window-${Date.now()}`, JSON.stringify(state));
              }
              store.dispatch('closeAllTabs', {
                windowId,
                amount: state.amount,
              });
            });
          } else {
            store.dispatch('closeAllTabs', {
              windowId,
              amount: -1,
            });
          }

          store.dispatch('closeWindow', windowId);
          delete windows[windowId];

          // https://github.com/electron/electron/issues/22290
          (window as any).removeAllListeners('blur');
          (window as any).removeAllListeners('focus');
          (window as any).removeAllListeners('maximize');
          (window as any).removeAllListeners('unmaximize');
          (window as any).removeAllListeners('minimize');
          (window as any).removeAllListeners('restore');
          (window as any).removeAllListeners('resize');
          (window as any).removeAllListeners('move');
          if (isWindows) {
            (window as any).removeAllListeners('app-command');
          }
          (window as any).removeAllListeners('scroll-touch-end');
          (window as any).removeAllListeners('scroll-touch-edge');
          close = true;
          window.close();
        }
      });

      handleWindowProperty(window, 'create');

      windows[windowId] = window;
    }
    event.returnValue = store.state;
  });

  ipcMain.on('vuex-action', (event, action) => {
    const { type } = action;
    store.dispatch(type, ...action.payload);
  });
};

const updateWindowStates = (): void => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    if (window.getTitle() !== 'command-palette') {
      handleWindowProperty((windows[id] as Electron.BrowserWindow), 'update');
    }
  });
};

function collect(newStart: number, newTabs: Lulumi.Store.TabObject[], newCurrentTabIndexes: number[], newWindows: Lulumi.Store.LulumiBrowserWindowProperty[], downloads) {
  return {
    pid: newStart + newTabs.length,
    tabs: newTabs,
    currentTabIndexes: newCurrentTabIndexes,
    currentSearchEngine: store.getters.currentSearchEngine,
    autoFetch: store.getters.autoFetch,
    homepage: store.getters.homepage,
    pdfViewer: store.getters.pdfViewer,
    tabConfig: store.getters.tabConfig,
    lang: store.getters.lang,
    proxyConfig: store.getters.proxyConfig,
    downloads: downloads.filter(download => download.state !== 'progressing'),
    history: store.getters.history,
    lastOpenedTabs: store.getters.lastOpenedTabs.slice(0, 8),
    windows: newWindows,
  };
}

function saveLulumiState(soft = true, bumpWindowIdsBy = 0): Promise<any> {
  const newStart = Math.ceil(Math.random() * 10000);
  const { tabObjects: newTabs, currentTabIndexes: newCurrentTabIndexes } =
    tabsOrdering(newStart, bumpWindowIdsBy);
  const newWindows = windowsOrdering(bumpWindowIdsBy);
  const { downloads } = store.getters;
  const pendingDownloads = downloads.filter(download => (download.state === 'progressing'));

  if (soft) {
    return Promise.resolve(
      collect(newStart, newTabs, newCurrentTabIndexes, newWindows, downloads)
    );
  }
  if (pendingDownloads.length !== 0) {
    ipcMain.once('okay-to-quit', (event, okay) => {
      if (okay) {
        return Promise.resolve(
          collect(newStart, newTabs, newCurrentTabIndexes, newWindows, this.$store.getters.downloads)
        );
      }
      return Promise.resolve('');
    });
    const browserWindow = BrowserWindow.getFocusedWindow();
    if (browserWindow !== null) {
      browserWindow.webContents.send('about-to-quit');
    }
  }
  return Promise.resolve(
    collect(newStart, newTabs, newCurrentTabIndexes, newWindows, downloads)
  );
}

function bumpWindowIds(bumpWindowIdsBy: number) {
  saveLulumiState(true, bumpWindowIdsBy).then((state) => {
    if (state && state.windows.length > 0) {
      let tmpWindow: Electron.BrowserWindow;
      state.windows.forEach((window) => {
        tmpWindow = (BrowserWindow as any).createWindow({
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
      state.windows = [];
      store.dispatch('setLulumiState', state);
    } else {
      (BrowserWindow as any).createWindow();
    }
  });
}

export default {
  getStore: () => store,
  register,
  updateWindowStates,
  saveLulumiState,
  bumpWindowIds,
  getWindows: () => windows,
};
