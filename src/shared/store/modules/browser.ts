import Vue from 'vue';

import * as types from '../mutation-types';
import config from '../../../renderer/js/constants/config';
import { store } from 'lulumi';
import timeUtil from '../../../renderer/js/lib/time-util';

/* tslint:disable:object-shorthand-properties-first */

const state: store.State = {
  tabId: 0,
  tabs: [],
  tabsOrder: [],
  currentTabIndexes: [],
  searchEngine: config.searchEngine,
  currentSearchEngine: config.currentSearchEngine,
  homepage: config.homepage,
  pdfViewer: config.pdfViewer,
  tabConfig: config.tabConfig,
  lang: 'en',
  downloads: [],
  history: [],
  permissions: {},
  lastOpenedTabs: [],
  certificates: {},
  windows: [],
};

// tslint:disable-next-line:max-line-length
function createTabObject(state: store.State, wid: number, openUrl: string | null = null): store.TabObject {
  return {
    webContentsId: -1,
    id: 0,
    index: 0,
    windowId: wid,
    highlighted: false,
    active: false,
    pinned: false,
    url: openUrl || state.tabConfig.dummyTabObject.url,
    title: null,
    favIconUrl: null,
    status: null,
    incognito: false,
    statusText: false,
    isLoading: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
    error: false,
    hasMedia: false,
    isAudioMuted: false,
    pageActionMapping: {},
  };
}

/* tslint:disable:function-name */
const mutations = {
  // global counter
  [types.INCREMENT_TAB_ID](state: store.State) {
    state.tabId += 1;
  },
  // tab handler
  [types.CREATE_TAB](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const url: string = payload.url;
    const isURL: boolean = payload.isURL;
    const follow: boolean = payload.follow;

    state.tabs.forEach((tab, index) => {
      Vue.set(state.tabs[index], 'highlighted', false);
      Vue.set(state.tabs[index], 'active', false);
    });

    let newUrl: string | null = null;
    if (isURL) {
      newUrl = url;
      state.tabs.push(createTabObject(state, windowId, newUrl));
    } else if (url) {
      newUrl = `${config.currentSearchEngine.search}${url}`;
      state.tabs.push(createTabObject(state, windowId, newUrl));
    } else {
      state.tabs.push(createTabObject(state, windowId));
    }
    const last = state.tabs.filter(tab => tab.windowId === windowId).length - 1;
    Vue.set(state.tabs[state.tabs.length - 1], 'id', state.tabId);
    if (url) {
      if (follow) {
        Vue.set(state.tabs[state.tabs.length - 1], 'highlighted', true);
        Vue.set(state.tabs[state.tabs.length - 1], 'active', true);
        Vue.set(state.currentTabIndexes, windowId, last);
      }
    } else {
      Vue.set(state.tabs[state.tabs.length - 1], 'highlighted', true);
      Vue.set(state.tabs[state.tabs.length - 1], 'active', true);
      Vue.set(state.currentTabIndexes, windowId, last);
    }
  },
  [types.CLOSE_TAB](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    const tabIndex: number = payload.tabIndex;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);
    const tabs = state.tabs.filter(tab => tab.windowId === windowId);

    if (tabs.length > tabIndex) {

      state.tabs.forEach((tab, index) => {
        Vue.set(state.tabs[index], 'highlighted', false);
        Vue.set(state.tabs[index], 'active', false);
      });

      if (state.tabs[tabsIndex].title !== 'error') {
        state.lastOpenedTabs.unshift({
          title: state.tabs[tabsIndex].title,
          url: state.tabs[tabsIndex].url,
          favIconUrl: state.tabs[tabsIndex].favIconUrl,
        });
      }

      if (tabs.length === 1) {
        Vue.delete(state.tabs, tabsIndex);
        state.tabId += 1;
        state.tabs.push(createTabObject(state, windowId));
        Vue.set(state.tabs[state.tabs.length - 1], 'id', state.tabId);
        Vue.set(state.tabs[state.tabs.length - 1], 'highlighted', true);
        Vue.set(state.tabs[state.tabs.length - 1], 'active', true);
        Vue.set(state.currentTabIndexes, windowId, 0);
      } else {
        // find the nearest adjacent tab to make active
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
        const mapping = tabsMapping(tabs, state.tabsOrder[windowId]);
        const currentTabIndex = state.currentTabIndexes[windowId];
        if (currentTabIndex === tabIndex) {
          Vue.delete(state.tabs, tabsIndex);
          for (let i = mapping[tabIndex] + 1; i < tabs.length; i += 1) {
            if (tabs[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
                const index: number
                  = state.tabs.findIndex(tab => (tab.id === state.tabs[mapping.indexOf(i) - 1].id));
                Vue.set(state.tabs[index], 'highlighted', true);
                Vue.set(state.tabs[index], 'active', true);
              } else {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i));
                const index: number
                  = state.tabs.findIndex(tab => (tab.id === state.tabs[mapping.indexOf(i)].id));
                Vue.set(state.tabs[index], 'highlighted', true);
                Vue.set(state.tabs[index], 'active', true);
              }
              return;
            }
          }
          for (let i = mapping[tabIndex] - 1; i >= 0; i -= 1) {
            if (tabs[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
                const index: number
                  = state.tabs.findIndex(tab => (tab.id === state.tabs[mapping.indexOf(i) - 1].id));
                Vue.set(state.tabs[index], 'highlighted', true);
                Vue.set(state.tabs[index], 'active', true);
              } else {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i));
                const index: number
                  = state.tabs.findIndex(tab => (tab.id === state.tabs[mapping.indexOf(i)].id));
                Vue.set(state.tabs[index], 'highlighted', true);
                Vue.set(state.tabs[index], 'active', true);
              }
              return;
            }
          }
        } else if (currentTabIndex > tabIndex) {
          Vue.delete(state.tabs, tabsIndex);
          Vue.set(state.currentTabIndexes, windowId, currentTabIndex - 1);
          const index: number
            = state.tabs.findIndex(tab => (tab.id === state.tabs[currentTabIndex - 1].id));
          Vue.set(state.tabs[index], 'highlighted', true);
          Vue.set(state.tabs[index], 'active', true);
        } else {
          Vue.delete(state.tabs, tabsIndex);
        }
      }
    }
  },
  [types.CLOSE_ALL_TAB](state: store.State, { windowId }) {
    state.tabs.map((tab, index) => {
      if (tab.windowId === windowId) {
        Vue.delete(state.tabs, index);
      }
    });
  },
  [types.CLICK_TAB](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    const tabIndex: number = payload.tabIndex;

    state.tabs.forEach((tab, index) => {
      Vue.set(state.tabs[index], 'highlighted', false);
      Vue.set(state.tabs[index], 'active', false);
    });

    Vue.set(state.currentTabIndexes, windowId, tabIndex);
    const index: number = state.tabs.findIndex(tab => (tab.id === tabId));
    Vue.set(state.tabs[index], 'highlighted', true);
    Vue.set(state.tabs[index], 'active', true);
  },
  // tab handlers
  [types.DID_START_LOADING](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const webContentsId: number = payload.webContentsId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].webContentsId = webContentsId;
      state.tabs[tabsIndex].url = url;
      state.tabs[tabsIndex].isLoading = true;
      state.tabs[tabsIndex].status = 'loading';
      state.tabs[tabsIndex].error = false;
    }
  },
  [types.LOAD_COMMIT](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].hasMedia = false;
    }
  },
  [types.PAGE_TITLE_SET](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const title: string = payload.title;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].title = title;
    }
  },
  [types.DOM_READY](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].canGoBack = payload.canGoBack;
      state.tabs[tabsIndex].canGoForward = payload.canGoForward;
      state.tabs[tabsIndex].canRefresh = true;
    }
  },
  [types.DID_FRAME_FINISH_LOAD](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex] && url) {
      state.tabs[tabsIndex].url = url;
      if (url.match(regexp)) {
        if (url.match(regexp)![1] === undefined) {
          const guestUrl = require('url').parse(url);
          const guestHash = guestUrl.hash.substr(2);
          state.tabs[tabsIndex].title
            = `${guestUrl.host} : ${guestHash === '' ? 'about' : guestHash}`;
        } else {
          state.tabs[tabsIndex].statusText = false;
          state.tabs[tabsIndex].canGoBack = payload.canGoBack;
          state.tabs[tabsIndex].canGoForward = payload.canGoForward;
          state.tabs[tabsIndex].isLoading = false;
        }
        state.tabs[tabsIndex].favIconUrl = config.tabConfig.lulumiFavicon;
      } else {
        if (state.tabs[tabsIndex].title === '') {
          state.tabs[tabsIndex].title = state.tabs[tabsIndex].url;
        }
        // history
        if (state.tabs[tabsIndex].title !== 'error') {
          if (state.history.length !== 0) {
            if (state.history[state.history.length - 1].url
              !== state.tabs[tabsIndex].url) {
              const date = timeUtil.getLocaleCurrentTime();
              state.history.unshift({
                title: state.tabs[tabsIndex].title,
                url: state.tabs[tabsIndex].url,
                favIconUrl: config.tabConfig.defaultFavicon,
                label: date.split(' ')[0],
                time: date.split(' ')[1],
              });
            }
          } else {
            const date = timeUtil.getLocaleCurrentTime();
            state.history.unshift({
              title: state.tabs[tabsIndex].title,
              url: state.tabs[tabsIndex].url,
              favIconUrl: config.tabConfig.defaultFavicon,
              label: date.split(' ')[0],
              time: date.split(' ')[1],
            });
          }
        }
      }
      state.tabs[tabsIndex].isLoading = false;
      state.tabs[tabsIndex].status = 'complete';
    }
  },
  [types.PAGE_FAVICON_UPDATED](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].favIconUrl = url;
    }
  },
  [types.DID_STOP_LOADING](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex] && url !== null) {
      if (!url.match(regexp)) {
        if (!state.tabs[tabsIndex].favIconUrl) {
          state.tabs[tabsIndex].favIconUrl = config.tabConfig.defaultFavicon;
        }
        // update favicon of the certain history
        if (state.tabs[tabsIndex].title !== 'error') {
          for (let i = 0; i < ((state.history.length < 10) ? state.history.length : 10); i += 1) {
            if (state.history[i].url === url) {
              state.history[i].favIconUrl = state.tabs[tabsIndex].favIconUrl;
            }
          }
        }
      }
      state.tabs[tabsIndex].canGoBack = payload.canGoBack;
      state.tabs[tabsIndex].canGoForward = payload.canGoForward;
      state.tabs[tabsIndex].statusText = false;
      state.tabs[tabsIndex].isLoading = false;
    }
  },
  [types.DID_FAIL_LOAD](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const isMainFrame: boolean = payload.isMainFrame;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex] && isMainFrame) {
      state.tabs[tabsIndex].title = 'error';
      state.tabs[tabsIndex].error = true;
    }
  },
  [types.UPDATE_TARGET_URL](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].statusText = url;
    }
  },
  [types.MEDIA_STARTED_PLAYING](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const isAudioMuted: boolean = payload.isAudioMuted;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].hasMedia = true;
      state.tabs[tabsIndex].isAudioMuted = isAudioMuted;
    }
  },
  [types.MEDIA_PAUSED](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].hasMedia = false;
    }
  },
  [types.TOGGLE_AUDIO](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const muted: boolean = payload.muted;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].isAudioMuted = muted;
    }
  },
  [types.UPDATE_CERTIFICATE](state: store.State, payload) {
    const hostname: string = payload.hostname;
    const certificate: Electron.Certificate = payload.certificate;
    const verificationResult: string = payload.verificationResult;
    const errorCode: string = payload.errorCode;

    if (state.certificates[hostname] === undefined) {
      Vue.set(state.certificates, hostname, {});
    }

    Vue.set(state.certificates[hostname]!, 'certificate', certificate);
    Vue.set(state.certificates[hostname]!, 'verificationResult', verificationResult);
    Vue.set(state.certificates[hostname]!, 'errorCode', errorCode);
  },
  // preferences handlers
  [types.SET_CURRENT_SEARCH_ENGINE_PROVIDER](state: store.State, { val }) {
    state.currentSearchEngine = val;
  },
  [types.SET_HOMEPAGE](state: store.State, { val }) {
    state.homepage = val.homepage;
  },
  [types.SET_PDF_VIEWER](state: store.State, { val }) {
    state.pdfViewer = val.pdfViewer;
  },
  [types.SET_TAB_CONFIG](state: store.State, { val }) {
    Vue.set(state.tabConfig, 'defaultFavicon', val.defaultFavicon);
    Vue.set(state.tabConfig.dummyTabObject, 'url', val.defaultUrl);
  },
  [types.SET_LANG](state: store.State, { val }) {
    state.lang = val.lang;
  },
  [types.SET_DOWNLOADS](state: store.State, { val }) {
    state.downloads = val;
  },
  [types.SET_HISTORY](state: store.State, { val }) {
    state.history = val;
  },
  [types.SET_TABS_ORDER](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const tabsOrder: string[] = payload.tabsOrder;
    if (tabsOrder.length !== 0) {
      Vue.set(state.tabsOrder, windowId, tabsOrder.map(element => parseInt(element, 10)));
      // assigning new indexes to tabs
      const tabs = state.tabs.filter(tab => tab.windowId === windowId);
      for (let index = 0; index < tabs.length; index += 1) {
        const tabsIndex: number
          = state.tabs.findIndex(tab => (tabs[tabsOrder[index]].id === tab.id));
        Vue.set(state.tabs[tabsIndex], 'index', index);
      }
    }
  },
  [types.SET_PAGE_ACTION](state: store.State, payload) {
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const extensionId: string = payload.extensionId;
    const enabled: boolean = payload.enabled;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      if (state.tabs[tabsIndex].pageActionMapping[extensionId]) {
        Vue.set(state.tabs[tabsIndex].pageActionMapping[extensionId], 'enabled', enabled);
      } else {
        Vue.set(state.tabs[tabsIndex].pageActionMapping, extensionId, {});
        Vue.set(state.tabs[tabsIndex].pageActionMapping[extensionId], 'enabled', enabled);
      }
    }
  },
  [types.CLEAR_PAGE_ACTION](state: store.State, payload) {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = state.tabs.findIndex(tab => tab.id === tabId);

    if (state.tabs[tabsIndex]) {
      state.tabs[tabsIndex].pageActionMapping = {};
    }
  },
  // downloads handlers
  [types.CREATE_DOWNLOAD_TASK](state: store.State, payload) {
    state.downloads.unshift(payload);
  },
  [types.UPDATE_DOWNLOADS_PROGRESS](state: store.State, payload) {
    const index = state.downloads.findIndex(download => download.startTime === payload.startTime);
    if (index !== -1) {
      const download = state.downloads[index];
      download.getReceivedBytes = payload.getReceivedBytes;
      download.savePath = payload.savePath;
      download.isPaused = payload.isPaused;
      download.canResume = payload.canResume;
      download.dataState = payload.dataState;
    }
  },
  [types.COMPLETE_DOWNLOADS_PROGRESS](state: store.State, payload) {
    const index = state.downloads.findIndex(download => download.startTime === payload.startTime);
    if (index !== -1) {
      const download = state.downloads[index];
      if (download.savePath) {
        download.name = payload.name;
        download.dataState = payload.dataState;
      } else {
        state.downloads.splice(index, 1);
      }
    }
  },
  [types.CLOSE_DOWNLOAD_BAR](state) {
    state.downloads.forEach(download => (download.style = 'hidden'));
  },
  // permissions
  [types.SET_PERMISSIONS](state: store.State, payload) {
    const hostname: string = payload.hostname;
    const permission: string = payload.permission;
    const accept: boolean = payload.accept;
    if (state.permissions[hostname] === undefined) {
      Vue.set(state.permissions, hostname, {});
    }

    Vue.set(state.permissions[hostname], permission, accept);
  },
  // app state
  [types.SET_APP_STATE](state: store.State, { newState }) {
    state.tabId = newState.pid;
    state.tabs = newState.tabs;
    state.currentTabIndexes = newState.currentTabIndexes;
    state.searchEngine = config.searchEngine;
    state.currentSearchEngine = newState.currentSearchEngine;
    state.homepage = newState.homepage;
    state.pdfViewer = newState.pdfViewer;
    state.tabConfig = newState.tabConfig;
    state.lang = newState.lang;
    state.downloads = newState.downloads;
    state.history = newState.history;
    state.windows = newState.windows;
  },
  // window state
  [types.CREATE_WINDOW](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const width: number = payload.width;
    const height: number = payload.height;
    const left: number = payload.left;
    const top: number = payload.top;
    const windowState: string = payload.windowState;
    const type: string = payload.type;

    const windowsIndex: number = state.windows.findIndex(window => window.id === windowId);
    if (windowsIndex === -1) {
      state.windows.push({
        id: windowId,
        width,
        height,
        left,
        top,
        state: windowState,
        type,
      });
    } else {
      Vue.set(state.windows, windowsIndex, {
        id: windowId,
        width,
        height,
        left,
        top,
        state: windowState,
        type,
      });
    }
  },
  [types.CLOSE_WINDOW](state: store.State, { windowId }) {
    const index: number = state.windows.findIndex(window => (window.id === windowId));
    if (index !== -1) {
      Vue.delete(state.windows, index);
    }
  },
  [types.UPDATE_WINDOW_PROPERTY](state: store.State, payload) {
    const windowId: number = payload.windowId;
    const width: number = payload.width;
    const height: number = payload.height;
    const left: number = payload.left;
    const top: number = payload.top;
    const focused: boolean = payload.focused;
    const windowState: string = payload.windowState;
    const index: number = state.windows.findIndex(window => (window.id === windowId));
    if (index !== -1) {
      Vue.set(state.windows[index], 'width', width);
      Vue.set(state.windows[index], 'height', height);
      Vue.set(state.windows[index], 'left', left);
      Vue.set(state.windows[index], 'top', top);
      Vue.set(state.windows[index], 'focused', focused);
      Vue.set(state.windows[index], 'state', windowState);
    }
  },
};

export default {
  state,
  mutations,
};
