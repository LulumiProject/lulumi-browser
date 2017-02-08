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
export const pageTitleSet = ({ commit }, pageIndex, webview) => {
  commit(types.PAGE_TITLE_SET, pageIndex, webview);
};
export const updateTargetUrl = ({ commit }, pageIndex, url) => {
  commit(types.UPDATE_TARGET_URL, pageIndex, url);
};
export const updateLocation = ({ commit }, url) => {
  commit(types.UPDATE_LOCATION, url);
};
