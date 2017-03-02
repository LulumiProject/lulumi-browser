import * as types from '../mutation-types';
import urlUtil from '../../js/lib/urlutil';

function createPageObject(url) {
  return {
    pid: 0,
    location: url || 'https://github.com/qazbnm456/lulumi-browser',
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

const state = {
  pid: 0,
  pages: [createPageObject()],
  currentPageIndex: 0,
  searchEngine: 'https://www.google.com/search?q=',
};

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
      newUrl = `https://www.google.com/search?q=${url}`;
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
    state.pages[payload.pageIndex].statusText = false;
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    if (!state.pages[payload.pageIndex].title) {
      state.pages[payload.pageIndex].title = state.pages[payload.pageIndex].location;
    }
    if (!state.pages[payload.pageIndex].location) {
      state.pages[payload.pageIndex].location = decodeURIComponent(payload.webview.getURL());
    }
    if (!state.pages[payload.pageIndex].favicon) {
      if (payload.pageIndex - 1 < 0) {
        state.pages[payload.pageIndex].favicon = 'https://github.com/favicon.ico';
      } else {
        state.pages[payload.pageIndex].favicon
          = state.pages[payload.pageIndex - 1].favicon || 'https://github.com/favicon.ico';
      }
    }
    state.pages[payload.pageIndex].isLoading = false;
  },
  [types.DID_FAIL_LOAD](state, pageIndex) {
    state.pages[pageIndex].title = 'error';
    state.pages[pageIndex].location = null;
    state.pages[pageIndex].error = true;
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
};

export default {
  state,
  mutations,
};
