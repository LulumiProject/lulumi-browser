import * as types from '../mutation-types';
import config from '../../js/constants/config';
import urlUtil from '../../js/lib/url-util';
import timeUtil from '../../js/lib/time-util';

const state = {
  pid: 0,
  pages: [],
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
};

function createPageObject(url) {
  return {
    pid: 0,
    location: url || state.tabConfig.defaultUrl,
    statusText: false,
    favicon: false,
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

const mutations = {
  // global counter
  [types.INCREMENT_PID](state) {
    state.pid += 1;
  },
  // tab handler
  [types.CREATE_TAB](state, payload) {
    const url = payload.url;
    let newUrl = null;
    if (urlUtil.isURL(url)) {
      newUrl = url;
      state.pages.push(createPageObject(newUrl));
    } else if (url) {
      newUrl = `${config.currentSearchEngine.search}${url}`;
      state.pages.push(createPageObject(newUrl));
    } else {
      state.pages.push(createPageObject());
    }
    const last = state.pages.length - 1;
    if (url) {
      if (payload.follow) {
        state.currentPageIndex = last;
      }
      state.pages[last].pid = state.pid;
    } else {
      state.currentPageIndex = last;
      state.pages[state.currentPageIndex].pid = state.pid;
    }
  },
  [types.CLOSE_TAB](state, pageIndex) {
    if (state.pages.length > pageIndex) {
      state.pages.splice(pageIndex, 1);
      if (state.pages.length === 0) {
        state.currentPageIndex = 0;
        state.pid += 1;
        state.pages.push(createPageObject());
        state.pages[state.pages.length - 1].pid = state.pid;
      } else {
        // find the nearest adjacent page to make active
        // eslint-disable-next-line no-lonely-if
        if (state.currentPageIndex >= pageIndex) {
          for (let i = pageIndex; i >= 0; i--) {
            if (state.pages[i]) {
              state.currentPageIndex = i;
              return;
            }
          }
          for (let i = pageIndex; i < state.pages.length; i++) {
            if (state.pages[i]) {
              state.currentPageIndex = i;
              return;
            }
          }
        }
      }
    }
  },
  [types.CLICK_TAB](state, pageIndex) {
    state.currentPageIndex = pageIndex;
  },
  // page handlers
  [types.DID_START_LOADING](state, pageIndex) {
    state.pages[pageIndex].isLoading = true;
    state.pages[pageIndex].error = false;
  },
  [types.DOM_READY](state, payload) {
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    state.pages[payload.pageIndex].canRefresh = true;
  },
  [types.DID_STOP_LOADING](state, payload) {
    const url = payload.webview.getURL();
    state.pages[payload.pageIndex].location = decodeURIComponent(url);
    if (url.startsWith(config.lulumiPagesCustomProtocol)) {
      const guestUrl = require('url').parse(url);
      const guestHash = guestUrl.hash.substr(2);
      state.pages[payload.pageIndex].title = `${guestUrl.host} : ${guestHash === '' ? 'about' : guestHash}`;
      state.pages[payload.pageIndex].location = decodeURIComponent(url);
    } else {
      if (!state.pages[payload.pageIndex].title) {
        state.pages[payload.pageIndex].title = state.pages[payload.pageIndex].location;
      }
      if (!state.pages[payload.pageIndex].favicon) {
        if (payload.pageIndex - 1 < 0) {
          state.pages[payload.pageIndex].favicon = config.tabConfig.defaultFavicon;
        } else {
          state.pages[payload.pageIndex].favicon
            = state.pages[payload.pageIndex - 1].favicon || config.tabConfig.defaultFavicon;
        }
      }
      if (state.pages[payload.pageIndex].title !== 'error') {
        if (state.history.length !== 0) {
          if (state.history[state.history.length - 1].url
            !== state.pages[payload.pageIndex].location) {
            const date = timeUtil.getLocaleCurrentTime();
            state.history.unshift({
              title: state.pages[payload.pageIndex].title,
              url: state.pages[payload.pageIndex].location,
              favicon: state.pages[payload.pageIndex].favicon,
              label: date.split(' ')[0],
              time: date.split(' ')[1],
            });
          }
        } else {
          const date = timeUtil.getLocaleCurrentTime();
          state.history.unshift({
            title: state.pages[payload.pageIndex].title,
            url: state.pages[payload.pageIndex].location,
            favicon: state.pages[payload.pageIndex].favicon,
            label: date.split(' ')[0],
            time: date.split(' ')[1],
          });
        }
      }
    }
    state.pages[payload.pageIndex].statusText = false;
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    state.pages[payload.pageIndex].isLoading = false;
  },
  [types.DID_FAIL_LOAD](state, payload) {
    if (payload.isMainFrame) {
      state.pages[payload.pageIndex].title = 'error';
      state.pages[payload.pageIndex].error = true;
    }
  },
  [types.PAGE_TITLE_SET](state, payload) {
    state.pages[payload.pageIndex].title = payload.webview.getTitle();
  },
  [types.UPDATE_TARGET_URL](state, payload) {
    state.pages[payload.pageIndex].statusText
      = decodeURIComponent(payload.url);
  },
  [types.MEDIA_STARTED_PLAYING](state, payload) {
    state.pages[payload.pageIndex].hasMedia = true;
    state.pages[payload.pageIndex].isAudioMuted = payload.webview.isAudioMuted();
  },
  [types.MEDIA_PAUSED](state, pageIndex) {
    state.pages[pageIndex].hasMedia = false;
  },
  [types.TOGGLE_AUDIO](state, payload) {
    state.pages[payload.pageIndex].isAudioMuted = payload.muted;
  },
  [types.PAGE_FAVICON_UPDATED](state, payload) {
    state.pages[payload.pageIndex].favicon = payload.url;
  },
  // preferences handlers
  [types.SET_CURRENT_SEARCH_ENGINE_PROVIDER](state, val) {
    state.currentSearchEngine = val;
  },
  [types.SET_HOMEPAGE](state, val) {
    state.homepage = val.homepage;
  },
  [types.SET_PDF_VIEWER](state, val) {
    state.pdfViewer = val.pdfViewer;
  },
  [types.SET_TAB_CONFIG](state, val) {
    state.tabConfig = val;
  },
  [types.SET_LANG](state, val) {
    state.lang = val.lang;
  },
  [types.SET_DOWNLOADS](state, val) {
    state.downloads = val;
  },
  [types.SET_HISTORY](state, val) {
    state.history = val;
  },
  [types.SET_PAGES](state, val) {
    state.pid = val.pid;
    state.pages = val.pages;
  },
  [types.SET_TABS_ORDER](state, val) {
    if (val.length === 0) {
      state.tabsOrder = val;
    } else {
      state.tabsOrder = val.map(element => parseInt(element, 10));
    }
  },
  [types.SET_PAGE_ACTION](state, payload) {
    if (state.pages[payload.pageIndex]) {
      if (state.pages[payload.pageIndex].pageActionMapping[payload.extensionId]) {
        state.pages[payload.pageIndex]
          .pageActionMapping[payload.extensionId].enabled = payload.enabled;
      } else {
        state.pages[payload.pageIndex]
          .pageActionMapping[payload.extensionId] = {};
        state.pages[payload.pageIndex]
          .pageActionMapping[payload.extensionId].enabled = payload.enabled;
      }
    }
  },
  [types.CLEAR_PAGE_ACTION](state, payload) {
    state.pages[payload.pageIndex].pageActionMapping = {};
  },
  // downloads handlers
  [types.CREATE_DOWNLOAD_TASK](state, file) {
    state.downloads.push(file);
  },
  [types.UPDATE_DOWNLOADS_PROGRESS](state, file) {
    state.downloads.every((download) => {
      if (download.startTime === file.startTime) {
        download.getReceivedBytes = file.getReceivedBytes;
        download.savePath = file.savePath;
        download.isPaused = file.isPaused;
        download.canResume = file.canResume;
        download.state = file.state;
        return false;
      }
      return true;
    });
  },
  [types.COMPLETE_DOWNLOADS_PROGRESS](state, file) {
    state.downloads.every((download, index) => {
      if (download.startTime === file.startTime) {
        if (download.savePath === '') {
          state.downloads.splice(index, 1);
        } else {
          download.name = file.name;
          download.state = file.state;
        }
        return false;
      }
      return true;
    });
  },
  [types.CLOSE_DOWNLOAD_BAR](state) {
    state.downloads.forEach((download) => {
      download.style = 'hidden';
    });
  },
  // permissions
  [types.SET_PERMISSIONS](state, scope) {
    if (state.permissions[scope.hostname]) {
      state.permissions[scope.hostname][scope.permission] = scope.accept;
    } else {
      state.permissions[scope.hostname] = {};
      state.permissions[scope.hostname][scope.permission] = scope.accept;
    }
  },
  // webContentsId => pageIndex mappings
  [types.UPDATE_MAPPINGS](state, data) {
    state.mappings[data.webContentsId] = data.pageIndex;
  },
  // app state
  [types.SET_APP_STATE](state, newState) {
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
