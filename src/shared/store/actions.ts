/* eslint-disable import/prefer-default-export */
/* eslint-disable max-len */

import * as types from './mutation-types';

export const actions = {
  incrementTabId({ commit }): void {
    commit(types.INCREMENT_TAB_ID);
  },

  createTab({ commit }, { windowId, url, isURL, follow }): void {
    commit(types.CREATE_TAB, {
      windowId,
      url,
      isURL,
      follow,
    });
  },
  closeTab({ commit }, { windowId, tabId, tabIndex }): void {
    commit(types.CLOSE_TAB, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  closeAllTabs({ commit }, { windowId, amount }): void {
    commit(types.CLOSE_ALL_TABS, {
      windowId,
      amount,
    });
  },
  clickTab({ commit }, { windowId, tabId, tabIndex }): void {
    commit(types.CLICK_TAB, {
      windowId,
      tabId,
      tabIndex,
    });
  },

  setBrowserViewId({ commit }, { browserViewId, tabId }): void {
    commit(types.SET_BROWSER_VIEW_ID, {
      browserViewId,
      tabId,
    });
  },
  didStartLoading({ commit }, { webContentsId, windowId, tabId, tabIndex, url }): void {
    commit(types.DID_START_LOADING, {
      webContentsId,
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  didNavigate({ commit }, { windowId, tabId, tabIndex, url }): void {
    commit(types.DID_NAVIGATE, {
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  pageTitleUpdated({ commit }, { windowId, tabId, tabIndex, title }): void {
    commit(types.PAGE_TITLE_UPDATED, {
      windowId,
      tabId,
      tabIndex,
      title,
    });
  },
  domReady({ commit }, { windowId, tabId, tabIndex, canGoBack, canGoForward }): void {
    commit(types.DOM_READY, {
      windowId,
      tabId,
      tabIndex,
      canGoBack,
      canGoForward,
    });
  },
  didFrameFinishLoad({ commit }, { windowId, tabId, tabIndex, url, canGoBack, canGoForward }): void {
    commit(types.DID_FRAME_FINISH_LOAD, {
      windowId,
      tabId,
      tabIndex,
      url,
      canGoBack,
      canGoForward,
    });
  },
  pageFaviconUpdated({ commit }, { windowId, tabId, tabIndex, url }): void {
    commit(types.PAGE_FAVICON_UPDATED, {
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  didStopLoading({ commit }, { windowId, tabId, tabIndex, url, canGoBack, canGoForward }): void {
    commit(types.DID_STOP_LOADING, {
      windowId,
      tabId,
      tabIndex,
      url,
      canGoBack,
      canGoForward,
    });
  },
  didFailLoad({ commit }, { windowId, tabId, tabIndex, isMainFrame }): void {
    commit(types.DID_FAIL_LOAD, {
      windowId,
      tabId,
      tabIndex,
      isMainFrame,
    });
  },
  updateTargetUrl({ commit }, { windowId, tabId, tabIndex, url }): void {
    commit(types.UPDATE_TARGET_URL, {
      windowId,
      tabId,
      tabIndex,
      url,
    });
  },
  mediaStartedPlaying({ commit }, { windowId, tabId, tabIndex, isAudioMuted }): void {
    commit(types.MEDIA_STARTED_PLAYING, {
      windowId,
      tabId,
      tabIndex,
      isAudioMuted,
    });
  },
  mediaPaused({ commit }, { windowId, tabId, tabIndex }): void {
    commit(types.MEDIA_PAUSED, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  toggleAudio({ commit }, { windowId, tabId, tabIndex, muted }): void {
    commit(types.TOGGLE_AUDIO, {
      windowId,
      tabId,
      tabIndex,
      muted,
    });
  },
  updateCertificate({ commit }, { hostname, certificate, verificationResult, errorCode }): void {
    commit(types.UPDATE_CERTIFICATE, {
      hostname,
      certificate,
      verificationResult,
      errorCode,
    });
  },
  updateExtensionMetadata({ commit }, { tabId, extensionId, browserActionIcon, pageActionIcon, badgeText, badgeBackgroundColor }): void {
    commit(types.UPDATE_EXTENSION_METADATA, {
      tabId,
      extensionId,
      browserActionIcon,
      pageActionIcon,
      badgeText,
      badgeBackgroundColor,
    });
  },

  setCurrentSearchEngineProvider({ commit }, val: any): void {
    commit(types.SET_CURRENT_SEARCH_ENGINE_PROVIDER, { val });
  },
  setHomepage({ commit }, val: any): void {
    commit(types.SET_HOMEPAGE, { val });
  },
  setPDFViewer({ commit }, val: any): void {
    commit(types.SET_PDF_VIEWER, { val });
  },
  setTabConfig({ commit }, val: any): void {
    commit(types.SET_TAB_CONFIG, { val });
  },
  setLang({ commit }, val: any): void {
    commit(types.SET_LANG, { val });
  },
  setProxyConfig({ commit }, val: any): void {
    commit(types.SET_PROXY_CONFIG, { val });
  },
  setAuth({ commit }, val: any): void {
    commit(types.SET_AUTH, { val });
  },
  setDownloads({ commit }, val: any): void {
    commit(types.SET_DOWNLOADS, { val });
  },
  setHistory({ commit }, val: any): void {
    commit(types.SET_HISTORY, { val });
  },
  setTabsOrder({ commit }, { windowId, tabsOrder }): void {
    commit(types.SET_TABS_ORDER, {
      windowId,
      tabsOrder,
    });
  },
  setPageAction({ commit }, { tabId, extensionId, enabled }): void {
    commit(types.SET_PAGE_ACTION, {
      tabId,
      extensionId,
      enabled,
    });
  },
  clearPageAction({ commit }, { windowId, tabId, tabIndex }): void {
    commit(types.CLEAR_PAGE_ACTION, {
      windowId,
      tabId,
      tabIndex,
    });
  },
  createDownloadTask({ commit }, { name, url, totalBytes, isPaused, canResume, startTime, getReceivedBytes, dataState, style }): void {
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
  updateDownloadsProgress({ commit }, { startTime, getReceivedBytes, savePath, isPaused, canResume, dataState }): void {
    commit(types.UPDATE_DOWNLOADS_PROGRESS, {
      startTime,
      getReceivedBytes,
      savePath,
      isPaused,
      canResume,
      dataState,
    });
  },
  completeDownloadsProgress({ commit }, { name, startTime, dataState }): void {
    commit(types.COMPLETE_DOWNLOADS_PROGRESS, {
      name,
      startTime,
      dataState,
    });
  },
  closeDownloadBar({ commit }) {
    commit(types.CLOSE_DOWNLOAD_BAR);
  },
  setPermissions({ commit }, { hostname, permission, accept }): void {
    commit(types.SET_PERMISSIONS, {
      hostname,
      permission,
      accept,
    });
  },

  setLulumiState({ commit }, newState: any): void {
    commit(types.SET_LULUMI_STATE, { newState });
  },

  createWindow({ commit }, { windowId, width, height, left, top, windowState, type }): void {
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
  closeWindow({ commit }, windowId: number): void {
    commit(types.CLOSE_WINDOW, { windowId });
  },
  updateWindowProperty({ commit }, { windowId, width, height, left, top, focused, windowState }): void {
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

  addExtension({ commit }, { extensionInfo }): void {
    commit(types.ADD_EXTENSION, {
      extensionInfo,
    });
  },
  removeExtension({ commit }, { extensionId }): void {
    commit(types.REMOVE_EXTENSION, {
      extensionId,
    });
  },
  updateExtension({ commit }, { enabled, extensionId }): void {
    commit(types.UPDATE_EXTENSION, {
      enabled,
      extensionId,
    });
  },
};
