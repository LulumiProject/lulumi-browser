import * as types from '../mutation-types';
import config from '../../../renderer/js/constants/config';
import { store } from 'lulumi';
import timeUtil from '../../../renderer/js/lib/time-util';

const state: store.State = {
  pid: 0,
  pages: [],
  windowIds: [],
  tabsOrder: [],
  currentPageIndex: 0,
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

function createPageObject(url: string | null = null): store.PageObject {
  return {
    pid: 0,
    location: url || state.tabConfig.defaultUrl,
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
    const location: string = payload.location;
    const isURL: boolean = payload.isURL;
    const follow: boolean = payload.follow;
    let newUrl: string | null = null;
    if (isURL) {
      newUrl = location;
      state.pages.push(createPageObject(newUrl));
    } else if (location) {
      newUrl = `${config.currentSearchEngine.search}${location}`;
      state.pages.push(createPageObject(newUrl));
    } else {
      state.pages.push(createPageObject());
    }
    const last = state.pages.length - 1;
    if (location) {
      if (follow) {
        state.currentPageIndex = last;
      }
      state.pages[last].pid = state.pid;
    } else {
      state.currentPageIndex = last;
      state.pages[state.currentPageIndex].pid = state.pid;
    }
  },
  [types.CLOSE_TAB](state, { pageIndex }) {
    if (state.pages.length > pageIndex) {
      if (state.pages[pageIndex].title !== 'error') {
        state.lastOpenedTabs.unshift({
          title: state.pages[pageIndex].title,
          url: state.pages[pageIndex].location,
          favicon: state.pages[pageIndex].favicon,
        });
      }

      if (state.pages.length === 1) {
        state.pages = [createPageObject()];
        state.pid += 1;
        state.pages[0].pid = state.pid;
        state.currentPageIndex = 0;
      } else {
        // find the nearest adjacent page to make active
        const tabsMapping = () => {
          const newOrder: number[] = [];
          for (let i = 0; i < state.pages.length; i += 1) {
            newOrder[i] = state.tabsOrder.indexOf(i) === -1
              ? i
              : state.tabsOrder.indexOf(i);
          }
          return newOrder;
        };
        const mapping = tabsMapping();
        const currentPageIndex = state.currentPageIndex;
        if (currentPageIndex === pageIndex) {
          for (let i = mapping[pageIndex] + 1; i < state.pages.length; i += 1) {
            if (state.pages[mapping.indexOf(i)]) {
              state.pages.splice(pageIndex, 1);
              if (mapping.indexOf(i) > pageIndex) {
                state.currentPageIndex = mapping.indexOf(i) - 1;
              } else {
                state.currentPageIndex = mapping.indexOf(i);
              }
              return;
            }
          }
          for (let i = mapping[pageIndex] - 1; i >= 0; i -= 1) {
            if (state.pages[mapping.indexOf(i)]) {
              state.pages.splice(pageIndex, 1);
              if (mapping.indexOf(i) > pageIndex) {
                state.currentPageIndex = mapping.indexOf(i) - 1;
              } else {
                state.currentPageIndex = mapping.indexOf(i);
              }
              return;
            }
          }
        } else if (currentPageIndex > pageIndex) {
          state.currentPageIndex = currentPageIndex - 1;
        }
        state.pages.splice(pageIndex, 1);
      }
    }
  },
  [types.CLICK_TAB](state, { pageIndex }) {
    state.currentPageIndex = pageIndex;
  },
  // Window
  [types.NEW_WINDOW](state, { windowId }) {
    state.windowIds.push(windowId);
  },
  // page handlers
  [types.DID_FRAME_FINISH_LOAD](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const location: string = payload.location;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    if (location !== '') {
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
  [types.DID_START_LOADING](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const location: string = payload.location;
    state.pages[pageIndex].location = location;
    state.pages[pageIndex].isLoading = true;
    state.pages[pageIndex].error = false;
  },
  [types.DOM_READY](state, payload) {
    const pageIndex: number = payload.pageIndex;
    state.pages[pageIndex].canGoBack = payload.canGoBack;
    state.pages[pageIndex].canGoForward = payload.canGoForward;
    state.pages[pageIndex].canRefresh = true;
  },
  [types.DID_STOP_LOADING](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const location: string = payload.location;
    const regexp: RegExp = new RegExp('^lulumi(-extension)?://.+$');

    if (location !== null) {
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
    const pageIndex: number = payload.pageIndex;
    const isMainFrame: boolean = payload.isMainFrame;
    if (isMainFrame) {
      state.pages[pageIndex].title = 'error';
      state.pages[pageIndex].error = true;
    }
  },
  [types.PAGE_TITLE_SET](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const title: string = payload.title;
    state.pages[pageIndex].title = title;
  },
  [types.UPDATE_TARGET_URL](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const location: string = payload.location;
    state.pages[pageIndex].statusText = location;
  },
  [types.MEDIA_STARTED_PLAYING](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const isAudioMuted: boolean = payload.isAudioMuted;
    state.pages[pageIndex].hasMedia = true;
    state.pages[pageIndex].isAudioMuted = isAudioMuted;
  },
  [types.MEDIA_PAUSED](state, { pageIndex }) {
    state.pages[pageIndex].hasMedia = false;
  },
  [types.TOGGLE_AUDIO](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const muted: boolean = payload.muted;
    state.pages[pageIndex].isAudioMuted = muted;
  },
  [types.PAGE_FAVICON_UPDATED](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const location: string = payload.location;
    state.pages[pageIndex].favicon = location;
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
    state.tabConfig = val;
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
  [types.SET_TABS_ORDER](state, { tabsOrder }) {
    if (tabsOrder.length === 0) {
      state.tabsOrder = tabsOrder;
    } else {
      state.tabsOrder = tabsOrder.map(element => parseInt(element, 10));
    }
  },
  [types.SET_PAGE_ACTION](state, payload) {
    const pageIndex: number = payload.pageIndex;
    const extensionId: string = payload.extensionId;
    const enabled: boolean = payload.enabled;
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
  [types.CLEAR_PAGE_ACTION](state, { pageIndex }) {
    state.pages[pageIndex].pageActionMapping = {};
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
    const pageIndex: number = payload.pageIndex;
    const webContentsId: number = payload.webContentsId;
    state.mappings[webContentsId] = pageIndex;
  },
  // app state
  [types.SET_APP_STATE](state, { newState }) {
    state.pid = newState.pid;
    state.pages = newState.pages;
    state.currentPageIndex = newState.currentPageIndex;
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
