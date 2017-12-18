import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { BrowserWindow, ipcMain } from 'electron';

import { actions } from './actions';
import { getters } from './getters';
import modules from './modules';

import { writeFile } from 'fs';
import promisify from '../../main/js/lib/promisify';
import urlResource from '../../renderer/js/lib/url-resource';

import { store } from 'lulumi';

Vue.use(Vuex);

/* tslint:disable:max-line-length */
/* tslint:disable:no-console */
/* tslint:disable:object-shorthand-properties-first */

const isWindows: boolean = process.platform === 'win32';
const windows: Electron.BrowserWindow[] = [];

let close: boolean = false;

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

function handleWindowProperty(store: Store<any>, window: Electron.BrowserWindow, action: string) {
  const bounds: Electron.Rectangle = window.getBounds();
  let windowState: string = 'normal';
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

const register = (storagePath: string, swipeGesture: boolean): void => {
  ipcMain.on('vuex-connect', (event: Electron.Event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.setMaxListeners(0);

    window.on('blur', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('focus', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('maximize', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('unmaximize', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('minimize', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('restore', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('resize', () => {
      handleWindowProperty(store, window, 'update');
    });
    window.on('move', () => {
      handleWindowProperty(store, window, 'update');
    });

    if (isWindows) {
      window.on('app-command', (event, command) => {
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

    ipcMain.on('window-id', (event: Electron.Event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      event.returnValue = window.id;
    });

    (window as any).callback(`any-new-tab-suggestion-for-window-${window.id}`);

    window.on('close', (event: Electron.Event) => {
      if (close) {
        close = false;
      } else {
        ipcMain.once(('window-close' as any), () => {
          store.dispatch('closeWindow', window.id);
          delete windows[window.id];
          window.webContents.removeAllListeners('blur');
          window.webContents.removeAllListeners('focus');
          window.webContents.removeAllListeners('maximize');
          window.webContents.removeAllListeners('unmaximize');
          window.webContents.removeAllListeners('minimize');
          window.webContents.removeAllListeners('restore');
          window.webContents.removeAllListeners('resize');
          window.webContents.removeAllListeners('move');
          if (isWindows) {
            window.webContents.removeAllListeners('app-command');
          }
          window.webContents.removeAllListeners('scroll-touch-end');
          window.webContents.removeAllListeners('scroll-touch-edge');
          window.webContents.removeAllListeners('window-id');
          close = true;
          window.close();
        });

        // store the property of this window into a temp
        handleWindowProperty(store, window, 'update');
        saveWindowState(window.id).then((state) => {
          if (state) {
            promisify(writeFile, `${storagePath}-window-${Date.now()}`, state);
          }
          window.webContents.send('window-close');
        });

        event.preventDefault();
      }
    });

    handleWindowProperty(store, window, 'create');

    windows[window.id] = window;
    event.returnValue = store.state;
  });

  ipcMain.on('vuex-action', (event, action) => {
    const type: string = action.type;
    store.dispatch(type, ...action.payload);
  });
};

const dispatch = (state) => {
  store.dispatch('setAppState', state);
};

const windowStateSave = (): void => {
  Object.values(windows).forEach((window) => {
    handleWindowProperty(store, window, 'update');
  });
};

const tabsMapping = (tabs: store.TabObject[], tabsOrder: number[]): number[] => {
  const newOrder: number[] = [];
  for (let index = 0; index < tabs.length; index += 1) {
    if (tabsOrder) {
      newOrder[index] = tabsOrder.indexOf(index) === -1
        ? index
        : tabsOrder.indexOf(index);
    } else {
      newOrder[index] = index;
    }
  }
  return newOrder;
};

function tabsOrdering(newStart: number, bumpWindowIdsBy: number, oneWindow: number = -1): store.TabsOrdering {
  let newTabId: number = newStart;
  let newTabs: store.TabObject[] = [];
  const newCurrentTabIndexes: number[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  if (oneWindow !== -1) {
    const tmpTabs: store.TabObject[] = [];
    const id = oneWindow;
    const currentTabIndex: number = store.getters.currentTabIndexes[id];
    const oldTabs: store.TabObject[]
      = store.getters.tabs.filter(tab => tab.windowId === id);
    const tabsOrder: number[] = tabsMapping(oldTabs, store.getters.tabsOrder[id]);
    oldTabs.forEach((tab, index) => {
      tmpTabs.push(Object.assign({}, oldTabs[tabsOrder[index]]));
    });
    tmpTabs.forEach((tab) => {
      tab.id = (newTabId += 1);
      tab.windowId = windowId;
      if (tab.url.startsWith('about:')) {
        tab.url = urlResource.aboutUrls(tab.url);
      }
      if (tab.url.startsWith('lulumi-extension:')) {
        tab.url = urlResource.aboutUrls('about:newtab');
      }
    });
    newTabs = tmpTabs;
    newCurrentTabIndexes[windowId] = tabsOrder.indexOf(currentTabIndex) === -1
      ? currentTabIndex
      : tabsOrder.indexOf(currentTabIndex);
  } else {
    Object.keys(windows).forEach((key) => {
      const tmpTabs: store.TabObject[] = [];
      const id = parseInt(key, 10);
      const currentTabIndex: number = store.getters.currentTabIndexes[id];
      const oldTabs: store.TabObject[]
        = store.getters.tabs.filter(tab => tab.windowId === id);
      const tabsOrder: number[] = tabsMapping(oldTabs, store.getters.tabsOrder[id]);
      oldTabs.forEach((tab, index) => {
        tmpTabs.push(Object.assign({}, oldTabs[tabsOrder[index]]));
      });
      tmpTabs.forEach((tab) => {
        tab.id = (newTabId += 1);
        tab.windowId = windowId;
        if (tab.url.startsWith('about:')) {
          tab.url = urlResource.aboutUrls(tab.url);
        }
        if (tab.url.startsWith('lulumi-extension:')) {
          tab.url = urlResource.aboutUrls('about:newtab');
        }
      });
      newTabs = newTabs.concat(tmpTabs);
      newCurrentTabIndexes[windowId] = tabsOrder.indexOf(currentTabIndex) === -1
        ? currentTabIndex
        : tabsOrder.indexOf(currentTabIndex);
      windowId += 1;
    });
  }
  return {
    tabObjects: newTabs,
    currentTabIndexes: newCurrentTabIndexes,
  };
}

function windowsOrdering(bumpWindowIdsBy: number, oneWindow: number = -1): store.LulumiBrowserWindowProperty[] {
  const newWindows: store.LulumiBrowserWindowProperty[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  if (oneWindow !== -1) {
    const id = oneWindow;
    const oldWindows: store.LulumiBrowserWindowProperty[] = store.getters.windows;
    const value: store.LulumiBrowserWindowProperty | undefined = oldWindows.find(window => window.id === id);
    if (value !== undefined) {
      const tmp: store.LulumiBrowserWindowProperty = Object.assign({}, value);
      tmp.id = windowId;
      newWindows.push(tmp);
    }
  } else {
    Object.keys(windows).forEach((key) => {
      const id = parseInt(key, 10);
      const oldWindows: store.LulumiBrowserWindowProperty[] = store.getters.windows;
      const value: store.LulumiBrowserWindowProperty | undefined = oldWindows.find(window => window.id === id);
      if (value !== undefined) {
        const tmp: store.LulumiBrowserWindowProperty = Object.assign({}, value);
        tmp.id = windowId;
        newWindows.push(tmp);
        windowId += 1;
      }
    });
  }
  return newWindows;
}

function collect(getters, newStart: number, newTabs: store.TabObject[], newCurrentTabIndexes: number[], newWindows: store.LulumiBrowserWindowProperty[], downloads) {
  return {
    pid: newStart + newTabs.length,
    tabs: newTabs,
    currentTabIndexes: newCurrentTabIndexes,
    currentSearchEngine: getters.currentSearchEngine,
    homepage: getters.homepage,
    pdfViewer: getters.pdfViewer,
    tabConfig: getters.tabConfig,
    lang: getters.lang,
    downloads: downloads.filter(download => download.state !== 'progressing'),
    history: getters.history,
    windows: newWindows,
  };
}

function saveAppState(soft: boolean = true, bumpWindowIdsBy: number = 0): Promise<any> {
  const newStart = Math.ceil(Math.random() * 10000);
  const { tabObjects: newTabs, currentTabIndexes: newCurrentTabIndexes }
    = tabsOrdering(newStart, bumpWindowIdsBy);
  const newWindows = windowsOrdering(bumpWindowIdsBy);
  const downloads = store.getters.downloads;
  const pendingDownloads = downloads.filter(download => download.state === 'progressing');

  if (soft) {
    return Promise.resolve(JSON.stringify(
      collect(store.getters, newStart, newTabs, newCurrentTabIndexes, newWindows, downloads)));
  }
  if (pendingDownloads.length !== 0) {
    ipcMain.once('okay-to-quit', (event, okay) => {
      if (okay) {
        return Promise.resolve(JSON.stringify(
          collect(store.getters, newStart, newTabs, newCurrentTabIndexes, newWindows, this.$store.getters.downloads)));
      }
      return Promise.resolve('');
    });
    BrowserWindow.getFocusedWindow().webContents.send('about-to-quit');
  }
  return Promise.resolve(JSON.stringify(
    collect(store.getters, newStart, newTabs, newCurrentTabIndexes, newWindows, downloads)));
}

function bumpWindowIds(bumpWindowIdsBy: number) {
  saveAppState(true, bumpWindowIdsBy).then((state) => {
    if (state) {
      store.dispatch('setAppState', JSON.parse(state));
    }
  });
}

function saveWindowState(windowId: number): Promise<any> {
  const { tabObjects: newTabs, currentTabIndexes: newCurrentTabIndexes }
    = tabsOrdering(0, 0, windowId);
  const newWindows = windowsOrdering(0, windowId);
  return Promise.resolve(JSON.stringify({
    amount: newTabs.length,
    tabs: newTabs,
    currentTabIndex: newCurrentTabIndexes[1],
    window: newWindows[0],
  }));
}

export default {
  getStore: () => store,
  register,
  dispatch,
  windowStateSave,
  saveAppState,
  bumpWindowIds,
  getWindows: () => windows,
};
