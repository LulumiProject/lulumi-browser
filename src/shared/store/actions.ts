import * as types from './mutation-types';

/* tslint:disable:max-line-length */

export const actions = {
  incrementTabId({ commit }) {
    commit(types.INCREMENT_TAB_ID);
  },

  createTab({ commit }, { windowId, url, isURL, follow }) {
    commit(types.CREATE_TAB, {
      windowId,
      url,
      isURL,
      follow,
    });
  },
  closeTab({ commit }, { windowId, tabId, tabIndex }) {
    commit(types.CLOSE_TAB, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  closeAllTab({ commit }, windowId) {
    commit(types.CLOSE_ALL_TAB, { windowId });
  },
  clickTab({ commit }, { windowId, tabId, tabIndex }) {
    commit(types.CLICK_TAB, {
      windowId,
      tabId,
      tabIndex,
    });
  },

  didStartLoading({ commit }, { webContentsId, windowId, tabId, tabIndex, url }) {
    commit(types.DID_START_LOADING, {
      webContentsId,
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  loadCommit({ commit }, { windowId, tabId, tabIndex }) {
    commit(types.LOAD_COMMIT, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  pageTitleSet({ commit }, { windowId, tabId, tabIndex, title }) {
    commit(types.PAGE_TITLE_SET, {
      windowId,
      tabId,
      tabIndex,
      title,
    });
  },
  domReady({ commit }, { windowId, tabId, tabIndex, canGoBack, canGoForward }) {
    commit(types.DOM_READY, {
      windowId,
      tabId,
      tabIndex,
      canGoBack,
      canGoForward,
    });
  },
  didFrameFinishLoad({ commit }, { windowId, tabId, tabIndex, url, canGoBack, canGoForward }) {
    commit(types.DID_FRAME_FINISH_LOAD, {
      windowId,
      tabId,
      tabIndex,
      url,
      canGoBack,
      canGoForward,
    });
  },
  pageFaviconUpdated({ commit }, { windowId, tabId, tabIndex, url }) {
    commit(types.PAGE_FAVICON_UPDATED, {
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  didStopLoading({ commit }, { windowId, tabId, tabIndex, url, canGoBack, canGoForward }) {
    commit(types.DID_STOP_LOADING, {
      windowId,
      tabId,
      tabIndex,
      url,
      canGoBack,
      canGoForward,
    });
  },
  didFailLoad({ commit }, { windowId, tabId, tabIndex, isMainFrame }) {
    commit(types.DID_FAIL_LOAD, {
      windowId,
      tabId,
      tabIndex,
      isMainFrame,
    });
  },
  updateTargetUrl({ commit }, { windowId, tabId, tabIndex, url }) {
    commit(types.UPDATE_TARGET_URL, {
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  mediaStartedPlaying({ commit }, { windowId, tabId, tabIndex, isAudioMuted }) {
    commit(types.MEDIA_STARTED_PLAYING, {
      windowId,
      tabId,
      tabIndex,
      isAudioMuted,
    });
  },
  mediaPaused({ commit }, { windowId, tabId, tabIndex }) {
    commit(types.MEDIA_PAUSED, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  toggleAudio({ commit }, { windowId, tabId, tabIndex, muted }) {
    commit(types.TOGGLE_AUDIO, {
      windowId,
      tabId,
      tabIndex,
      muted,
    });
  },
  updateCertificate({ commit }, { hostname, certificate, verificationResult, errorCode }) {
    commit(types.UPDATE_CERTIFICATE, {
      hostname,
      certificate,
      verificationResult,
      errorCode,
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
  setPageAction({ commit }, { tabId, extensionId, enabled }) {
    commit(types.SET_PAGE_ACTION, {
      tabId,
      extensionId,
      enabled,
    });
  },
  clearPageAction({ commit }, { windowId, tabId, tabIndex }) {
    commit(types.CLEAR_PAGE_ACTION, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  createDownloadTask({ commit }, { name, url, totalBytes, isPaused, canResume, startTime, getReceivedBytes, dataState, style }) {
    commit(types.CREATE_DOWNLOAD_TASK, {
      name,
      url,
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

  setAppState({ commit }, newState) {
    commit(types.SET_APP_STATE, { newState });
  },

  createWindow({ commit }, { windowId, width, height, left, top, windowState, type }) {
    commit(types.CREATE_WINDOW, {
      windowId,
      width,
      height,
      left,
      top,
      windowState,
      type,
    });
  },
  closeWindow({ commit }, windowId) {
    commit(types.CLOSE_WINDOW, { windowId });
  },
  updateWindowProperty({ commit }, { windowId, width, height, left, top, focused, windowState }) {
    commit(types.UPDATE_WINDOW_PROPERTY, {
      windowId,
      width,
      height,
      left,
      top,
      focused,
      windowState,
    });
  },
};
