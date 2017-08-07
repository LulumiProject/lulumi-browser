import * as types from './mutation-types';

/* tslint:disable:max-line-length */

export const actions = {
  incrementPid({ commit }) {
    commit(types.INCREMENT_PID);
  },

  createTab({ commit }, { location, isURL, follow }) {
    commit(types.CREATE_TAB, {
      location,
      isURL,
      follow,
    });
  },
  closeTab({ commit }, pageIndex) {
    commit(types.CLOSE_TAB, { pageIndex });
  },
  clickTab({ commit }, pageIndex) {
    commit(types.CLICK_TAB, { pageIndex });
  },

  newWindow({ commit }, windowId) {
    commit(types.NEW_WINDOW, { windowId });
  },

  didFrameFinishLoad({ commit }, { pageIndex, location, canGoBack, canGoForward }) {
    commit(types.DID_FRAME_FINISH_LOAD, {
      pageIndex,
      location,
      canGoBack,
      canGoForward,
    });
  },
  didStartLoading({ commit }, { pageIndex, location }) {
    commit(types.DID_START_LOADING, {
      pageIndex,
      location,
    });
  },
  domReady({ commit }, { pageIndex, canGoBack, canGoForward }) {
    commit(types.DOM_READY, {
      pageIndex,
      canGoBack,
      canGoForward,
    });
  },
  didStopLoading({ commit }, { pageIndex, location, canGoBack, canGoForward }) {
    commit(types.DID_STOP_LOADING, {
      pageIndex,
      location,
      canGoBack,
      canGoForward,
    });
  },
  didFailLoad({ commit }, { pageIndex, isMainFrame }) {
    commit(types.DID_FAIL_LOAD, {
      pageIndex,
      isMainFrame,
    });
  },
  pageTitleSet({ commit }, { pageIndex, title }) {
    commit(types.PAGE_TITLE_SET, {
      pageIndex,
      title,
    });
  },
  updateTargetUrl({ commit }, { pageIndex, location }) {
    commit(types.UPDATE_TARGET_URL, {
      pageIndex,
      location,
    });
  },
  mediaStartedPlaying({ commit }, { pageIndex, isAudioMuted }) {
    commit(types.MEDIA_STARTED_PLAYING, {
      pageIndex,
      isAudioMuted,
    });
  },
  mediaPaused({ commit }, pageIndex) {
    commit(types.MEDIA_PAUSED, { pageIndex });
  },
  toggleAudio({ commit }, { pageIndex, muted }) {
    commit(types.TOGGLE_AUDIO, {
      pageIndex,
      muted,
    });
  },
  pageFaviconUpdated({ commit }, { pageIndex, location }) {
    commit(types.PAGE_FAVICON_UPDATED, {
      pageIndex,
      location,
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
  setTabsOrder({ commit }, tabsOrder) {
    commit(types.SET_TABS_ORDER, { tabsOrder });
  },
  setPageAction({ commit }, { pageIndex, extensionId, enabled }) {
    commit(types.SET_PAGE_ACTION, {
      pageIndex,
      extensionId,
      enabled,
    });
  },
  clearPageAction({ commit }, pageIndex) {
    commit(types.CLEAR_PAGE_ACTION, { pageIndex });
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

  updateMappings({ commit }, { pageIndex, webContentsId }) {
    commit(types.UPDATE_MAPPINGS, {
      pageIndex,
      webContentsId,
    });
  },

  setAppState({ commit }, newState) {
    commit(types.SET_APP_STATE, { newState });
  },
};
