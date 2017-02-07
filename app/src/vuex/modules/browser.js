import * as types from '../mutation-types';

function createPageObject(url) {
  return {
    pid: 0,
    location: url || 'https://github.com/qazbnm456/electron-vue-browser',
    statusText: false,
    title: 'new tab',
    isLoading: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
  };
}

const state = {
  pid: 0,
  pages: [createPageObject()],
  currentPageIndex: 0,
};

const mutations = {
  // global counter
  [types.INCREMENT_PID](state) {
    state.pid += 1;
  },
  // tab handler
  [types.CREATE_TAB](state, url) {
    state.pages.push(createPageObject(url));
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
          }
        }
        for (let i = pageIndex; i < state.pages.length; i++) {
          if (state.pages[i]) {
            state.currentPageIndex = i;
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
    state.pages[pageIndex].title = false;
  },
  [types.DOM_READY](state, payload) {
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    state.pages[payload.pageIndex].canRefresh = true;
  },
  [types.DID_STOP_LOADING](state, payload) {
    state.pages[payload.pageIndex].statusText = false;
    state.pages[payload.pageIndex].location = payload.webview.getURL();
    state.pages[payload.pageIndex].canGoBack = payload.webview.canGoBack();
    state.pages[payload.pageIndex].canGoForward = payload.webview.canGoForward();
    if (!state.pages[payload.pageIndex].title) {
      state.pages[payload.pageIndex].title = state.pages[payload.pageIndex].location;
    }
    state.pages[payload.pageIndex].isLoading = false;
  },
  [types.PAGE_TITLE_SET](state, payload) {
    state.pages[payload.pageIndex].title = payload.webview.getTitle();
    state.pages[payload.pageIndex].location = payload.webview.getURL();
  },
  [types.UPDATE_LOCATION](state, url) {
    state.pages[state.currentPageIndex].location = url;
    // state.pages.splice(state.currentPageIndex, 1, createPageObject(url));
  },
};

export default {
  state,
  mutations,
};
