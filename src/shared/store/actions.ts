import * as types from './mutation-types';

/* tslint:disable:max-line-length */

export const actions = {
  incrementPid({ commit }) {
    commit(types.INCREMENT_PID);
  },

  createTab({ commit }, { windowId, location, isURL, follow }) {
    commit(types.CREATE_TAB, {
      windowId,
      location,
      isURL,
      follow,
    });
  },
  closeTab({ commit }, { windowId, pageId, tabIndex }) {
    commit(types.CLOSE_TAB, {
      windowId,
      pageId,
      tabIndex,
    });
  },
  closeAllTab({ commit }, windowId) {
    commit(types.CLOSE_ALL_TAB, { windowId });
  },
  clickTab({ commit }, { windowId, pageId, tabIndex }) {
    commit(types.CLICK_TAB, {
      windowId,
      pageId,
      tabIndex,
    });
  },

  didStartLoading({ commit }, { windowId, pageId, tabIndex, location }) {
    commit(types.DID_START_LOADING, {
      windowId,
      pageId,
      tabIndex,
      location,
    });
  },
  loadCommit({ commit }, { windowId, pageId, tabIndex }) {
    commit(types.LOAD_COMMIT, {
      windowId,
      pageId,
      tabIndex,
    });
  },
  pageTitleSet({ commit }, { windowId, pageId, tabIndex, title }) {
    commit(types.PAGE_TITLE_SET, {
      windowId,
      pageId,
      tabIndex,
      title,
    });
  },
  domReady({ commit }, { windowId, pageId, tabIndex, canGoBack, canGoForward }) {
    commit(types.DOM_READY, {
      windowId,
      pageId,
      tabIndex,
      canGoBack,
      canGoForward,
    });
  },
  didFrameFinishLoad({ commit }, { windowId, pageId, tabIndex, location, canGoBack, canGoForward }) {
    commit(types.DID_FRAME_FINISH_LOAD, {
      windowId,
      pageId,
      tabIndex,
      location,
      canGoBack,
      canGoForward,
    });
  },
  pageFaviconUpdated({ commit }, { windowId, pageId, tabIndex, location }) {
    commit(types.PAGE_FAVICON_UPDATED, {
      windowId,
      pageId,
      tabIndex,
      location,
    });
  },
  didStopLoading({ commit }, { windowId, pageId, tabIndex, location, canGoBack, canGoForward }) {
    commit(types.DID_STOP_LOADING, {
      windowId,
      pageId,
      tabIndex,
      location,
      canGoBack,
      canGoForward,
    });
  },
  didFailLoad({ commit }, { windowId, pageId, tabIndex, isMainFrame }) {
    commit(types.DID_FAIL_LOAD, {
      windowId,
      pageId,
      tabIndex,
      isMainFrame,
    });
  },
  updateTargetUrl({ commit }, { windowId, pageId, tabIndex, location }) {
    commit(types.UPDATE_TARGET_URL, {
      windowId,
      pageId,
      tabIndex,
      location,
    });
  },
  mediaStartedPlaying({ commit }, { windowId, pageId, tabIndex, isAudioMuted }) {
    commit(types.MEDIA_STARTED_PLAYING, {
      windowId,
      pageId,
      tabIndex,
      isAudioMuted,
    });
  },
  mediaPaused({ commit }, { windowId, pageId, tabIndex }) {
    commit(types.MEDIA_PAUSED, {
      windowId,
      pageId,
      tabIndex,
    });
  },
  toggleAudio({ commit }, { windowId, pageId, tabIndex, muted }) {
    commit(types.TOGGLE_AUDIO, {
      windowId,
      pageId,
      tabIndex,
      muted,
    });
  },

  setCurrentSearchEngineProvider({ commit }, val) {
    commit(types.SET_CURRENT_SEARCH_ENGINE_PROVIDER, { val });
  },
  setHomepage({ commit }, val) {
    commit(types.SET_HOMEPAGE, { val });
  },
  setPDFViewer({ commit }, val) {
    commit(types.SET_PDF_VIEWER, { val });
  },
  setTabConfig({ commit }, val) {
    commit(types.SET_TAB_CONFIG, { val });
  },
  setLang({ commit }, val) {
    commit(types.SET_LANG, { val });
  },
  setDownloads({ commit }, val) {
    commit(types.SET_DOWNLOADS, { val });
  },
  setHistory({ commit }, val) {
    commit(types.SET_HISTORY, { val });
  },
  setTabsOrder({ commit }, { windowId, tabsOrder }) {
    commit(types.SET_TABS_ORDER, {
      windowId,
      tabsOrder,
    });
  },
  setPageAction({ commit }, { pageId, extensionId, enabled }) {
    commit(types.SET_PAGE_ACTION, {
      pageId,
      extensionId,
      enabled,
    });
  },
  clearPageAction({ commit }, { windowId, pageId, tabIndex }) {
    commit(types.CLEAR_PAGE_ACTION, {
      windowId,
      pageId,
      tabIndex,
    });
  },
  createDownloadTask({ commit }, { name, location, totalBytes, isPaused, canResume, startTime, getReceivedBytes, dataState, style }) {
    commit(types.CREATE_DOWNLOAD_TASK, {
      name,
      location,
      totalBytes,
      isPaused,
      canResume,
      startTime,
      getReceivedBytes,
      dataState,
      style,
    });
  },
  updateDownloadsProgress({ commit }, { startTime, getReceivedBytes, savePath, isPaused, canResume, dataState }) {
    commit(types.UPDATE_DOWNLOADS_PROGRESS, {
      startTime,
      getReceivedBytes,
      savePath,
      isPaused,
      canResume,
      dataState,
    });
  },
  completeDownloadsProgress({ commit }, { name, startTime, dataState }) {
    commit(types.COMPLETE_DOWNLOADS_PROGRESS, {
      name,
      startTime,
      dataState,
    });
  },
  closeDownloadBar({ commit }) {
    commit(types.CLOSE_DOWNLOAD_BAR);
  },
  setPermissions({ commit }, { hostname, permission, accept }) {
    commit(types.SET_PERMISSIONS, {
      hostname,
      permission,
      accept,
    });
  },

  updateMappings({ commit }, { windowId, pageId, tabIndex, webContentsId }) {
    commit(types.UPDATE_MAPPINGS, {
      windowId,
      pageId,
      tabIndex,
      webContentsId,
    });
  },

  setAppState({ commit }, newState) {
    commit(types.SET_APP_STATE, { newState });
  },
};
