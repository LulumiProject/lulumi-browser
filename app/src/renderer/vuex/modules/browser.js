import * as types from '../mutation-types';
import config from '../../js/constants/config';
import urlUtil from '../../js/lib/urlutil';

const state = {
  pid: 0,
  pages: [],
  currentPageIndex: 0,
  searchEngine: config.searchEngine,
  currentSearchEngine: config.currentSearchEngine,
  homepage: config.homepage,
  tabConfig: config.tabConfig,
  downloads: [],
  history: [],
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
  };
}

state.pages.push(createPageObject());

const mutations = {
  // global counter
  [types.INCREMENT_PID](state) {
    state.pid += 1;
  },
  // tab handler
  [types.CREATE_TAB](state, url) {
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
    if (url) {
      state.pages[state.pages.length - 1].pid = state.pid;
    } else {
      state.currentPageIndex = state.pages.length - 1;
      state.pages[state.currentPageIndex].pid = state.pid;
    }
  },
  [types.CLOSE_TAB](state, pageIndex) {
    if (state.pages.length > pageIndex) {
      if (state.pages.length === 1) {
        state.pages = [createPageObject()];
        state.currentPageIndex = 0;
      } else {
        state.pages.splice(pageIndex, 1);

        // find the nearest adjacent page to make active
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
    state.pages[payload.pageIndex].statusText = false;
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    if (url.startsWith(config.lulumiPagesCustomProtocol)) {
      const guestUrl = require('url').parse(url);
      const guestHash = guestUrl.hash.substr(2);
      state.pages[payload.pageIndex].title = `${guestUrl.host} : ${guestHash === '' ? 'about' : guestHash}`;
      state.pages[payload.pageIndex].location = url;
    } else {
      if (!state.pages[payload.pageIndex].title) {
        state.pages[payload.pageIndex].title = state.pages[payload.pageIndex].location;
      }
      if (!state.pages[payload.pageIndex].location) {
        state.pages[payload.pageIndex].location = decodeURIComponent(url);
      }
      if (!state.pages[payload.pageIndex].favicon) {
        if (payload.pageIndex - 1 < 0) {
          state.pages[payload.pageIndex].favicon = config.tabConfig.defaultFavicon;
        } else {
          state.pages[payload.pageIndex].favicon
            = state.pages[payload.pageIndex - 1].favicon || config.tabConfig.defaultFavicon;
        }
      }
      if (state.history.length !== 0) {
        if (state.history[state.history.length - 1].url
          !== state.pages[payload.pageIndex].location) {
          state.history.push({
            title: state.pages[payload.pageIndex].title,
            url: state.pages[payload.pageIndex].location,
            favicon: state.pages[payload.pageIndex].favicon,
          });
        }
      } else {
        state.history.push({
          title: state.pages[payload.pageIndex].title,
          url: state.pages[payload.pageIndex].location,
          favicon: state.pages[payload.pageIndex].favicon,
        });
      }
    }
    state.pages[payload.pageIndex].isLoading = false;
  },
  [types.DID_FAIL_LOAD](state, pageIndex) {
    if (!state.pages[pageIndex].title) {
      state.pages[pageIndex].title = 'error';
      state.pages[pageIndex].location = null;
      state.pages[pageIndex].error = true;
    }
  },
  [types.PAGE_TITLE_SET](state, payload) {
    state.pages[payload.pageIndex].title = payload.webview.getTitle();
    state.pages[payload.pageIndex].location
      = decodeURIComponent(urlUtil.getLocationIfPDF(payload.webview.getURL()));
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
  [types.UPDATE_LOCATION](state, url) {
    state.pages[state.currentPageIndex].location
      = decodeURIComponent(urlUtil.getLocationIfPDF(url));
  },
  // preferences handlers
  [types.SET_CURRENT_SEARCH_ENGINE_PROVIDER](state, val) {
    state.currentSearchEngine = val;
  },
  [types.SET_HOMEPAGE](state, val) {
    state.homepage = val.homepage;
  },
  [types.SET_TAB_CONFIG](state, val) {
    state.tabConfig = val;
  },
  [types.SET_DOWNLOADS](state, val) {
    state.downloads = val;
  },
  [types.SET_HISTORY](state, val) {
    state.history = val;
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
      // eslint-disable-next-line no-else-return
      } else {
        return true;
      }
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
      // eslint-disable-next-line no-else-return
      } else {
        return true;
      }
    });
  },
  [types.CLOSE_DOWNLOAD_BAR](state) {
    state.downloads.forEach((download) => {
      download.style = 'hidden';
    });
  },
};

export default {
  state,
  mutations,
};
