import * as types from './mutation-types';

export const actions = {
  incrementPid({ commit }) {
    commit(types.INCREMENT_PID);
  },

  createTab({ commit }, payload) {
    commit(types.CREATE_TAB, payload);
  },
  closeTab({ commit }, pageIndex) {
    commit(types.CLOSE_TAB, pageIndex);
  },
  clickTab({ commit }, pageIndex) {
    commit(types.CLICK_TAB, pageIndex);
  },

  didStartLoading({ commit }, payload) {
    commit(types.DID_START_LOADING, payload);
  },
  domReady({ commit }, payload) {
    commit(types.DOM_READY, payload);
  },
  didStopLoading({ commit }, payload) {
    commit(types.DID_STOP_LOADING, payload);
  },
  didFailLoad({ commit }, payload) {
    commit(types.DID_FAIL_LOAD, payload);
  },
  pageTitleSet({ commit }, payload) {
    commit(types.PAGE_TITLE_SET, payload);
  },
  updateTargetUrl({ commit }, payload) {
    commit(types.UPDATE_TARGET_URL, payload);
  },
  mediaStartedPlaying({ commit }, pageIndex) {
    commit(types.MEDIA_STARTED_PLAYING, pageIndex);
  },
  mediaPaused({ commit }, pageIndex) {
    commit(types.MEDIA_PAUSED, pageIndex);
  },
  toggleAudio({ commit }, payload) {
    commit(types.TOGGLE_AUDIO, payload);
  },
  pageFaviconUpdated({ commit }, payload) {
    commit(types.PAGE_FAVICON_UPDATED, payload);
  },

  setCurrentSearchEngineProvider({ commit }, val) {
    commit(types.SET_CURRENT_SEARCH_ENGINE_PROVIDER, val);
  },
  setHomepage({ commit }, val) {
    commit(types.SET_HOMEPAGE, val);
  },
  setPDFViewer({ commit }, val) {
    commit(types.SET_PDF_VIEWER, val);
  },
  setTabConfig({ commit }, val) {
    commit(types.SET_TAB_CONFIG, val);
  },
  setLang({ commit }, val) {
    commit(types.SET_LANG, val);
  },
  setDownloads({ commit }, val) {
    commit(types.SET_DOWNLOADS, val);
  },
  setHistory({ commit }, val) {
    commit(types.SET_HISTORY, val);
  },
  setTabsOrder({ commit }, val) {
    commit(types.SET_TABS_ORDER, val);
  },
  setPageAction({ commit }, payload) {
    commit(types.SET_PAGE_ACTION, payload);
  },
  clearPageAction({ commit }, pageIndex) {
    commit(types.CLEAR_PAGE_ACTION, pageIndex);
  },
  createDownloadTask({ commit }, file) {
    commit(types.CREATE_DOWNLOAD_TASK, file);
  },
  updateDownloadsProgress({ commit }, file) {
    commit(types.UPDATE_DOWNLOADS_PROGRESS, file);
  },
  completeDownloadsProgress({ commit }, file) {
    commit(types.COMPLETE_DOWNLOADS_PROGRESS, file);
  },
  closeDownloadBar({ commit }) {
    commit(types.CLOSE_DOWNLOAD_BAR);
  },
  setPermissions({ commit }, scope) {
    commit(types.SET_PERMISSIONS, scope);
  },

  updateMappings({ commit }, data) {
    commit(types.UPDATE_MAPPINGS, data);
  },

  setAppState({ commit }, newState) {
    commit(types.SET_APP_STATE, newState);
  },
};
