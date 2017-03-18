import * as types from './mutation-types';

export const incrementPid = ({ commit }) => {
  commit(types.INCREMENT_PID);
};

export const createTab = ({ commit }, url) => {
  commit(types.CREATE_TAB, url);
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
export const didFailLoad = ({ commit }, pageIndex) => {
  commit(types.DID_FAIL_LOAD, pageIndex);
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

export const updateLocation = ({ commit }, url) => {
  commit(types.UPDATE_LOCATION, url);
};
export const setCurrentSearchEngineProvider = ({ commit }, val) => {
  commit(types.SET_CURRENT_SEARCH_ENGINE_PROVIDER, val);
};
export const setHomepage = ({ commit }, val) => {
  commit(types.SET_HOMEPAGE, val);
};
export const setTabConfig = ({ commit }, val) => {
  commit(types.SET_TAB_CONFIG, val);
};
