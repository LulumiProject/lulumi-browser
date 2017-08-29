import Vue from 'vue';
import Vuex from 'vuex';
import { BrowserWindow, ipcMain } from 'electron';

import { actions } from './actions';
import { getters } from './getters';
import modules from './modules';

import urlResource from '../../renderer/js/lib/url-resource';

import { store } from 'lulumi';

Vue.use(Vuex);

/* tslint:disable:max-line-length */
/* tslint:disable:no-console */
/* tslint:disable:object-shorthand-properties-first */

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

const register = (storagePath: string, swipeGesture: boolean): void => {
  ipcMain.on('vuex-connect', (event: Electron.Event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.setMaxListeners(0);

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

    window.on('close', (event: Electron.Event) => {
      if (close) {
        close = false;
      } else {
        ipcMain.once(('window-close' as any), () => {
          store.dispatch('closeWindow', window.id);
          delete windows[window.id];
          window.webContents.removeAllListeners('scroll-touch-begin');
          window.webContents.removeAllListeners('scroll-touch-end');
          window.webContents.removeAllListeners('scroll-touch-edge');
          close = true;
          window.close();
        });
        window.webContents.send('window-close');
        event.preventDefault();
      }
    });

    // window state
    const bounds: Electron.Rectangle = window.getBounds();
    let windowState: string = 'normal';
    if (window.isFullScreen()) {
      windowState = 'fullscreen';
    } else if (window.isMaximized()) {
      windowState = 'maximized';
    } else if (window.isMinimized()) {
      windowState = 'minimized';
    }
    store.dispatch('createWindow', {
      windowId: window.id,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      windowState,
      type: (window.webContents as any).getType(),
    });

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
    const bounds: Electron.Rectangle = window.getBounds();
    let windowState: string = 'normal';
    if (window.isFullScreen()) {
      windowState = 'fullscreen';
    } else if (window.isMaximized()) {
      windowState = 'maximized';
    } else if (window.isMinimized()) {
      windowState = 'minimized';
    }
    store.dispatch('updateWindowProperty', {
      windowId: window.id,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      focused: window.isFocused(),
      windowState,
    });
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

function tabsOrdering(newStart: number, bumpWindowIdsBy: number): store.TabObject[] {
  let newTabId: number = newStart;
  let newTabs: store.TabObject[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  Object.keys(windows).forEach((key) => {
    const tmpTabs: store.TabObject[] = [];
    const id = parseInt(key, 10);
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
    windowId += 1;
  });
  return newTabs;
}

function tabIndexesOrdering(bumpWindowIdsBy: number): number[] {
  const newCurrentTabIndexes: number[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const tabs: store.TabObject[]
      = store.getters.tabs.filter(tab => tab.windowId === id);
    const tabsOrder: number[] = tabsMapping(tabs, store.getters.tabsOrder[id]);
    const currentTabIndex: number = store.getters.currentTabIndexes[id];
    newCurrentTabIndexes[windowId] = tabsOrder.indexOf(currentTabIndex) === -1
      ? currentTabIndex
      : tabsOrder.indexOf(currentTabIndex);
    windowId += 1;
  });
  return newCurrentTabIndexes;
}

function windowsOrdering(bumpWindowIdsBy: number): store.LulumiBrowserWindowProperty[] {
  const newWindows: store.LulumiBrowserWindowProperty[] = [];
  let windowId: number = bumpWindowIdsBy === 0
    ? (1 + bumpWindowIdsBy)
    : (parseInt(Object.keys(windows)[0], 10) + bumpWindowIdsBy);
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const oldWindows: store.LulumiBrowserWindowProperty[] = store.getters.windows;
    const index: number = store.getters.windows.findIndex(window => window.windowId === id);
    const tmp: store.LulumiBrowserWindowProperty = Object.assign({}, oldWindows[index]);
    tmp.windowId = windowId;
    newWindows.push(tmp);
    windowId += 1;
  });
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
  const newTabs = tabsOrdering(newStart, bumpWindowIdsBy);
  const newCurrentTabIndexes = tabIndexesOrdering(bumpWindowIdsBy);
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

export default {
  getStore: () => store,
  register,
  dispatch,
  windowStateSave,
  saveAppState,
  bumpWindowIds,
  getWindows: () => windows,
};
