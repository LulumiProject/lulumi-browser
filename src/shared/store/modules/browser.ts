import Vue from 'vue';

import * as types from '../mutation-types';
import config from '../../../renderer/js/constants/config';
import { store } from 'lulumi';
import timeUtil from '../../../renderer/js/lib/time-util';

const state: store.State = {
  pid: 0,
  pages: [],
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
  mappings: [],
  lastOpenedTabs: [],
};

// tslint:disable-next-line:max-line-length
function createPageObject(state: store.State, wid: number, url: string | null = null): store.PageObject {
  return {
    pid: 0,
    windowId: wid,
    location: url || state.tabConfig.dummyPageObject.location,
    statusText: false,
    favicon: null,
    title: null,
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
  [types.INCREMENT_PID](state) {
    state.pid += 1;
  },
  // tab handler
  [types.CREATE_TAB](state, payload) {
    const windowId: number = payload.windowId;
    const location: string = payload.location;
    const isURL: boolean = payload.isURL;
    const follow: boolean = payload.follow;
    let newUrl: string | null = null;
    if (isURL) {
      newUrl = location;
      state.pages.push(createPageObject(state, windowId, newUrl));
    } else if (location) {
      newUrl = `${config.currentSearchEngine.search}${location}`;
      state.pages.push(createPageObject(state, windowId, newUrl));
    } else {
      state.pages.push(createPageObject(state, windowId));
    }
    const last = state.pages.filter(page => page.windowId === windowId).length - 1;
    state.pages[state.pages.length - 1].pid = state.pid;
    if (location) {
      if (follow) {
        Vue.set(state.currentTabIndexes, windowId, last);
      }
    } else {
      Vue.set(state.currentTabIndexes, windowId, last);
    }
  },
  [types.CLOSE_TAB](state, payload) {
    const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    const tabIndex: number = payload.tabIndex;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);
    const pages = state.pages.filter(page => page.windowId === windowId);

    if (pages.length > tabIndex) {
      if (state.pages[pageIndex].title !== 'error') {
        state.lastOpenedTabs.unshift({
          title: state.pages[pageIndex].title,
          location: state.pages[pageIndex].location,
          favicon: state.pages[pageIndex].favicon,
        });
      }

      if (pages.length === 1) {
        Vue.delete(state.pages, pageIndex);
        state.pid += 1;
        state.pages.push(createPageObject(state, windowId));
        state.pages[state.pages.length - 1].pid = state.pid;
        Vue.set(state.currentTabIndexes, windowId, 0);
      } else {
        // find the nearest adjacent page to make active
        const tabsMapping = (pages: store.PageObject[], tabsOrder: number[]): number[] => {
          const newOrder: number[] = [];
          for (let index = 0; index < pages.length; index += 1) {
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
        const mapping = tabsMapping(pages, state.tabsOrder[windowId]);
        const currentTabIndex = state.currentTabIndexes[windowId];
        if (currentTabIndex === tabIndex) {
          Vue.delete(state.pages, pageIndex);
          for (let i = mapping[tabIndex] + 1; i < pages.length; i += 1) {
            if (pages[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
              } else {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i));
              }
              return;
            }
          }
          for (let i = mapping[tabIndex] - 1; i >= 0; i -= 1) {
            if (pages[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
              } else {
                Vue.set(state.currentTabIndexes, windowId, mapping.indexOf(i));
              }
              return;
            }
          }
        } else if (currentTabIndex > tabIndex) {
          Vue.delete(state.pages, pageIndex);
          Vue.set(state.currentTabIndexes, windowId, currentTabIndex - 1);
        } else {
          Vue.delete(state.pages, pageIndex);
        }
      }
    }
  },
  [types.CLOSE_ALL_TAB](state, { windowId }) {
    state.pages.map((page, index) => {
      if (page.windowId === windowId) {
        Vue.delete(state.pages, index);
      }
    });
  },
  [types.CLICK_TAB](state, payload) {
    const windowId: number = payload.windowId;
    // const pageId: number = payload.pageId;
    const tabIndex: number = payload.tabIndex;

    Vue.set(state.currentTabIndexes, windowId, tabIndex);
    state.currentTabIndexes[windowId] = tabIndex;
  },
  // page handlers
  [types.DID_START_LOADING](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const location: string = payload.location;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].location = location;
      state.pages[pageIndex].isLoading = true;
      state.pages[pageIndex].error = false;
    }
  },
  [types.LOAD_COMMIT](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].hasMedia = false;
    }
  },
  [types.PAGE_TITLE_SET](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const title: string = payload.title;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].title = title;
    }
  },
  [types.DOM_READY](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].canGoBack = payload.canGoBack;
      state.pages[pageIndex].canGoForward = payload.canGoForward;
      state.pages[pageIndex].canRefresh = true;
    }
  },
  [types.DID_FRAME_FINISH_LOAD](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const location: string = payload.location;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex] && location !== '') {
      state.pages[pageIndex].location = location;
      if (location.match(regexp)) {
        if (location.match(regexp)![1] === undefined) {
          const guestUrl = require('url').parse(location);
          const guestHash = guestUrl.hash.substr(2);
          state.pages[pageIndex].title
            = `${guestUrl.host} : ${guestHash === '' ? 'about' : guestHash}`;
        } else {
          state.pages[pageIndex].statusText = false;
          state.pages[pageIndex].canGoBack = payload.canGoBack;
          state.pages[pageIndex].canGoForward = payload.canGoForward;
          state.pages[pageIndex].isLoading = false;
        }
        state.pages[pageIndex].favicon = config.tabConfig.lulumiFavicon;
      } else {
        if (state.pages[pageIndex].title === '') {
          state.pages[pageIndex].title = state.pages[pageIndex].location;
        }
        // history
        if (state.pages[pageIndex].title !== 'error') {
          if (state.history.length !== 0) {
            if (state.history[state.history.length - 1].url
              !== state.pages[pageIndex].location) {
              const date = timeUtil.getLocaleCurrentTime();
              state.history.unshift({
                title: state.pages[pageIndex].title,
                url: state.pages[pageIndex].location,
                favicon: config.tabConfig.defaultFavicon,
                label: date.split(' ')[0],
                time: date.split(' ')[1],
              });
            }
          } else {
            const date = timeUtil.getLocaleCurrentTime();
            state.history.unshift({
              title: state.pages[pageIndex].title,
              url: state.pages[pageIndex].location,
              favicon: config.tabConfig.defaultFavicon,
              label: date.split(' ')[0],
              time: date.split(' ')[1],
            });
          }
        }
      }
      state.pages[pageIndex].isLoading = false;
    }
  },
  [types.PAGE_FAVICON_UPDATED](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const location: string = payload.location;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].favicon = location;
    }
  },
  [types.DID_STOP_LOADING](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const location: string = payload.location;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex] && location !== null) {
      if (!location.match(regexp)) {
        if (!state.pages[pageIndex].favicon) {
          state.pages[pageIndex].favicon = config.tabConfig.defaultFavicon;
        }
        // update favicon of the certain history
        if (state.pages[pageIndex].title !== 'error') {
          for (let i = 0; i < ((state.history.length < 10) ? state.history.length : 10); i += 1) {
            if (state.history[i].url === location) {
              state.history[i].favicon = state.pages[pageIndex].favicon;
            }
          }
        }
      }
      state.pages[pageIndex].canGoBack = payload.canGoBack;
      state.pages[pageIndex].canGoForward = payload.canGoForward;
      state.pages[pageIndex].statusText = false;
      state.pages[pageIndex].isLoading = false;
    }
  },
  [types.DID_FAIL_LOAD](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const isMainFrame: boolean = payload.isMainFrame;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex] && isMainFrame) {
      state.pages[pageIndex].title = 'error';
      state.pages[pageIndex].error = true;
    }
  },
  [types.UPDATE_TARGET_URL](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const location: string = payload.location;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].statusText = location;
    }
  },
  [types.MEDIA_STARTED_PLAYING](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const isAudioMuted: boolean = payload.isAudioMuted;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].hasMedia = true;
      state.pages[pageIndex].isAudioMuted = isAudioMuted;
    }
  },
  [types.MEDIA_PAUSED](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].hasMedia = false;
    }
  },
  [types.TOGGLE_AUDIO](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const muted: boolean = payload.muted;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].isAudioMuted = muted;
    }
  },
  // preferences handlers
  [types.SET_CURRENT_SEARCH_ENGINE_PROVIDER](state, { val }) {
    state.currentSearchEngine = val;
  },
  [types.SET_HOMEPAGE](state, { val }) {
    state.homepage = val.homepage;
  },
  [types.SET_PDF_VIEWER](state, { val }) {
    state.pdfViewer = val.pdfViewer;
  },
  [types.SET_TAB_CONFIG](state, { val }) {
    Vue.set(state.tabConfig, 'defaultFavicon', val.defaultFavicon);
    Vue.set(state.tabConfig.dummyPageObject, 'location', val.defaultLocation);
  },
  [types.SET_LANG](state, { val }) {
    state.lang = val.lang;
  },
  [types.SET_DOWNLOADS](state, { val }) {
    state.downloads = val;
  },
  [types.SET_HISTORY](state, { val }) {
    state.history = val;
  },
  [types.SET_TABS_ORDER](state, payload) {
    const windowId: number = payload.windowId;
    const tabsOrder: string[] = payload.tabsOrder;
    if (tabsOrder.length !== 0) {
      Vue.set(state.tabsOrder, windowId, tabsOrder.map(element => parseInt(element, 10)));
    }
  },
  [types.SET_PAGE_ACTION](state, payload) {
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;
    const extensionId: string = payload.extensionId;
    const enabled: boolean = payload.enabled;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      if (state.pages[pageIndex].pageActionMapping[extensionId]) {
        state.pages[pageIndex]
          .pageActionMapping[extensionId].enabled = enabled;
      } else {
        state.pages[pageIndex]
          .pageActionMapping[extensionId] = {};
        state.pages[pageIndex]
          .pageActionMapping[extensionId].enabled = enabled;
      }
    }
  },
  [types.CLEAR_PAGE_ACTION](state, payload) {
    // const windowId: number = payload.windowId;
    const pageId: number = payload.pageId;
    // const tabIndex: number = payload.tabIndex;

    const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    if (state.pages[pageIndex]) {
      state.pages[pageIndex].pageActionMapping = {};
    }
  },
  // downloads handlers
  [types.CREATE_DOWNLOAD_TASK](state, payload) {
    state.downloads.unshift(payload);
  },
  [types.UPDATE_DOWNLOADS_PROGRESS](state, payload) {
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
  [types.COMPLETE_DOWNLOADS_PROGRESS](state, payload) {
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
  [types.SET_PERMISSIONS](state, payload) {
    const hostname: string = payload.hostname;
    const permission: string = payload.permission;
    const accept: boolean = payload.accept;
    if (state.permissions[hostname]) {
      state.permissions[hostname][permission] = accept;
    } else {
      state.permissions[hostname] = {};
      state.permissions[hostname][permission] = accept;
    }
  },
  // webContentsId => pageIndex mappings
  [types.UPDATE_MAPPINGS](state, payload) {
    // const windowId: number = payload.windowId;
    // const pageId: number = payload.pageId;
    const tabIndex: number = payload.tabIndex;
    const webContentsId: number = payload.webContentsId;

    // const pageIndex = state.pages.findIndex(page => page.pid === pageId);

    state.mappings[webContentsId] = tabIndex;
  },
  // app state
  [types.SET_APP_STATE](state, { newState }) {
    state.pid = newState.pid;
    state.pages = newState.pages;
    state.currentTabIndexes = newState.currentTabIndexes;
    state.searchEngine = config.searchEngine;
    state.currentSearchEngine = newState.currentSearchEngine;
    state.homepage = newState.homepage;
    state.pdfViewer = newState.pdfViewer;
    state.tabConfig = newState.tabConfig;
    state.lang = newState.lang;
    state.downloads = newState.downloads;
    state.history = newState.history;
  },
};

export default {
  state,
  mutations,
};
