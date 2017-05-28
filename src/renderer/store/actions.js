import * as types from './mutation-types';

export const incrementPid = ({ commit }) => {
  commit(types.INCREMENT_PID);
};

export const createTab = ({ commit }, url, follow) => {
  commit(types.CREATE_TAB, url, follow);
};
export const closeTab = ({ commit }, pageIndex) => {
  commit(types.CLOSE_TAB, pageIndex);
};
export const clickTab = ({ commit }, pageIndex) => {
  commit(types.CLICK_TAB, pageIndex);
};

export const didStartLoading = ({ commit }, pageIndex) => {
  commit(types.DID_START_LOADING, pageIndex);
};
export const domReady = ({ commit }, pageIndex, webview) => {
  commit(types.DOM_READY, pageIndex, webview);
};
export const didStopLoading = ({ commit }, pageIndex, webview) => {
  commit(types.DID_STOP_LOADING, pageIndex, webview);
};
export const didFailLoad = ({ commit }, pageIndex, isMainFrame) => {
  commit(types.DID_FAIL_LOAD, pageIndex, isMainFrame);
};
export const pageTitleSet = ({ commit }, pageIndex, webview) => {
  commit(types.PAGE_TITLE_SET, pageIndex, webview);
};
export const updateTargetUrl = ({ commit }, pageIndex, url) => {
  commit(types.UPDATE_TARGET_URL, pageIndex, url);
};
export const mediaStartedPlaying = ({ commit }, pageIndex) => {
  commit(types.MEDIA_STARTED_PLAYING, pageIndex);
};
export const mediaPaused = ({ commit }, pageIndex) => {
  commit(types.MEDIA_PAUSED, pageIndex);
};
export const toggleAudio = ({ commit }, pageIndex, muted) => {
  commit(types.TOGGLE_AUDIO, pageIndex, muted);
};
export const pageFaviconUpdated = ({ commit }, pageIndex, url) => {
  commit(types.PAGE_FAVICON_UPDATED, pageIndex, url);
};

export const setCurrentSearchEngineProvider = ({ commit }, val) => {
  commit(types.SET_CURRENT_SEARCH_ENGINE_PROVIDER, val);
};
export const setHomepage = ({ commit }, val) => {
  commit(types.SET_HOMEPAGE, val);
};
export const setPDFViewer = ({ commit }, val) => {
  commit(types.SET_PDF_VIEWER, val);
};
export const setTabConfig = ({ commit }, val) => {
  commit(types.SET_TAB_CONFIG, val);
};
export const setLang = ({ commit }, val) => {
  commit(types.SET_LANG, val);
};
export const setDownloads = ({ commit }, val) => {
  commit(types.SET_DOWNLOADS, val);
};
export const setHistory = ({ commit }, val) => {
  commit(types.SET_HISTORY, val);
};
export const setPages = ({ commit }, val) => {
  commit(types.SET_PAGES, val);
};
export const setTabsOrder = ({ commit }, val) => {
  commit(types.SET_TABS_ORDER, val);
};
export const setPageAction = ({ commit }, pageIndex, extensionId, enabled) => {
  commit(types.SET_PAGE_ACTION, pageIndex, extensionId, enabled);
};
export const clearPageAction = ({ commit }, pageIndex) => {
  commit(types.CLEAR_PAGE_ACTION, pageIndex);
};
export const createDownloadTask = ({ commit }, file) => {
  commit(types.CREATE_DOWNLOAD_TASK, file);
};
export const updateDownloadsProgress = ({ commit }, file) => {
  commit(types.UPDATE_DOWNLOADS_PROGRESS, file);
};
export const completeDownloadsProgress = ({ commit }, file) => {
  commit(types.COMPLETE_DOWNLOADS_PROGRESS, file);
};
export const closeDownloadBar = ({ commit }) => {
  commit(types.CLOSE_DOWNLOAD_BAR);
};
export const setPermissions = ({ commit }, scope) => {
  commit(types.SET_PERMISSIONS, scope);
};

export const updateMappings = ({ commit }, webContentsId, pageIndex) => {
  commit(types.UPDATE_MAPPINGS, webContentsId, pageIndex);
};

export const setAppState = ({ commit }, newState) => {
  commit(types.SET_APP_STATE, newState);
};
