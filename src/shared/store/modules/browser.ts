/* eslint-disable max-len */
/* eslint-disable prefer-destructuring */

import Vue from 'vue';

import * as types from '../mutation-types';
import constants from '../../../renderer/mainBrowserWindow/constants';
import timeUtil from '../../../renderer/lib/time-util';
import urlUtil from '../../../renderer/lib/url-util';

const state: Lulumi.Store.State = {
  tabId: 0,
  tabs: [],
  tabsOrder: [],
  currentTabIndexes: [0],
  searchEngine: constants.searchEngine,
  currentSearchEngine: constants.currentSearchEngine,
  autoFetch: constants.autoFetch,
  homepage: constants.homepage,
  pdfViewer: constants.pdfViewer,
  tabConfig: constants.tabConfig,
  lang: 'en',
  proxyConfig: constants.proxyConfig,
  auth: { username: '', password: '' },
  downloads: [],
  history: [],
  permissions: {},
  lastOpenedTabs: [],
  certificates: {},
  windows: [],
  extensionInfoDict: {},
};

// eslint-disable-next-line max-len
function createTabObject(stateContext: Lulumi.Store.State, wid: number, openUrl: string | null = null): Lulumi.Store.TabObject {
  return {
    browserViewId: -1,
    webContentsId: -1,
    id: 0,
    index: 0,
    windowId: wid,
    highlighted: false,
    active: false,
    pinned: false,
    url: openUrl || stateContext.tabConfig.dummyTabObject.url,
    title: null,
    favIconUrl: null,
    status: null,
    incognito: false,
    statusText: false,
    isLoading: false,
    didNavigate: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
    error: false,
    hasMedia: false,
    isAudioMuted: false,
    pageActionMapping: {},
    extensionsMetadata: {},
  };
}

const mutations = {
  // global counter
  [types.INCREMENT_TAB_ID](stateContext: Lulumi.Store.State): void {
    stateContext.tabId += 1;
  },
  // tab handler
  [types.CREATE_TAB](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const url: string = payload.url;
    const isURL: boolean = payload.isURL;
    const follow: boolean = payload.follow;

    stateContext.tabs.forEach((tab, index) => {
      Vue.set(stateContext.tabs[index], 'highlighted', false);
      Vue.set(stateContext.tabs[index], 'active', false);
    });

    let newUrl: string | null = null;
    if (isURL) {
      newUrl = url;
      stateContext.tabs.push(createTabObject(stateContext, windowId, newUrl));
    } else if (url) {
      newUrl =
        constants.currentSearchEngine.search.replace('{queryString}', encodeURIComponent(url));
      stateContext.tabs.push(createTabObject(stateContext, windowId, newUrl));
    } else {
      stateContext.tabs.push(createTabObject(stateContext, windowId));
    }

    Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'id', stateContext.tabId);

    const last = stateContext.tabs.filter(tab => tab.windowId === windowId).length - 1;
    if (url) {
      if (follow) {
        Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'highlighted', true);
        Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'active', true);
        Vue.set(stateContext.currentTabIndexes, windowId, last);
      }
    } else {
      Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'highlighted', true);
      Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'active', true);
      Vue.set(stateContext.currentTabIndexes, windowId, last);
    }
  },
  [types.CLOSE_TAB](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    const tabIndex: number = payload.tabIndex;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);
    const tabs = stateContext.tabs.filter(tab => tab.windowId === windowId);

    if (tabs.length > tabIndex) {
      stateContext.tabs.forEach((tab, index) => {
        Vue.set(stateContext.tabs[index], 'highlighted', false);
        Vue.set(stateContext.tabs[index], 'active', false);
      });

      if (stateContext.tabs[tabsIndex].title !== 'error') {
        stateContext.lastOpenedTabs.unshift({
          title: stateContext.tabs[tabsIndex].title,
          url: stateContext.tabs[tabsIndex].url,
          favIconUrl: stateContext.tabs[tabsIndex].favIconUrl,
          mtime: timeUtil.getMillisecondsTime(),
        });
      }

      if (tabs.length === 1) {
        Vue.delete(stateContext.tabs, tabsIndex);
        stateContext.tabId += 1;
        stateContext.tabs.push(createTabObject(stateContext, windowId));
        Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'id', stateContext.tabId);
        Object.keys(stateContext.extensionInfoDict).forEach((extensionId) => {
          Vue.set(stateContext.tabs[stateContext.tabs.length - 1].extensionsMetadata, extensionId, {
            browserActionIcon: '#',
            pageActionIcon: '#',
            badgeText: '',
            badgeBackgroundColor: '',
          });
        });
        Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'highlighted', true);
        Vue.set(stateContext.tabs[stateContext.tabs.length - 1], 'active', true);
        Vue.set(stateContext.currentTabIndexes, windowId, 0);
      } else {
        // find the nearest adjacent tab to make active
        // eslint-disable-next-line max-len
        const tabsMapping = (mappedTabs: Lulumi.Store.TabObject[], tabsOrder: number[]): number[] => {
          const newOrder: number[] = [];
          for (let index = 0; index < mappedTabs.length; index += 1) {
            if (tabsOrder) {
              newOrder[index] = !tabsOrder.includes(index)
                ? index
                : tabsOrder.indexOf(index);
            } else {
              newOrder[index] = index;
            }
          }
          return newOrder;
        };
        const mapping = tabsMapping(tabs, stateContext.tabsOrder[windowId]);
        const currentTabIndex = stateContext.currentTabIndexes[windowId];
        if (currentTabIndex === tabIndex) {
          Vue.delete(stateContext.tabs, tabsIndex);
          for (let i = mapping[tabIndex] + 1; i < tabs.length; i += 1) {
            if (tabs[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(stateContext.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
                const index: number =
                  stateContext.tabs.findIndex(tab => (
                    tab.id === stateContext.tabs[mapping.indexOf(i) - 1].id
                  ));
                Vue.set(stateContext.tabs[index], 'highlighted', true);
                Vue.set(stateContext.tabs[index], 'active', true);
              } else {
                Vue.set(stateContext.currentTabIndexes, windowId, mapping.indexOf(i));
                const index: number =
                  stateContext.tabs.findIndex(tab => (
                    tab.id === stateContext.tabs[mapping.indexOf(i)].id
                  ));
                Vue.set(stateContext.tabs[index], 'highlighted', true);
                Vue.set(stateContext.tabs[index], 'active', true);
              }
              return;
            }
          }
          for (let i = mapping[tabIndex] - 1; i >= 0; i -= 1) {
            if (tabs[mapping.indexOf(i)]) {
              if (mapping.indexOf(i) > tabIndex) {
                Vue.set(stateContext.currentTabIndexes, windowId, mapping.indexOf(i) - 1);
                const index: number =
                  stateContext.tabs.findIndex(tab => (
                    tab.id === stateContext.tabs[mapping.indexOf(i) - 1].id
                  ));
                Vue.set(stateContext.tabs[index], 'highlighted', true);
                Vue.set(stateContext.tabs[index], 'active', true);
              } else {
                Vue.set(stateContext.currentTabIndexes, windowId, mapping.indexOf(i));
                const index: number =
                  stateContext.tabs.findIndex(tab => (
                    tab.id === stateContext.tabs[mapping.indexOf(i)].id
                  ));
                Vue.set(stateContext.tabs[index], 'highlighted', true);
                Vue.set(stateContext.tabs[index], 'active', true);
              }
              return;
            }
          }
        } else if (currentTabIndex > tabIndex) {
          Vue.delete(stateContext.tabs, tabsIndex);
          Vue.set(stateContext.currentTabIndexes, windowId, currentTabIndex - 1);
          const index: number =
            stateContext.tabs.findIndex(tab => (
              tab.id === stateContext.tabs[currentTabIndex - 1].id
            ));
          Vue.set(stateContext.tabs[index], 'highlighted', true);
          Vue.set(stateContext.tabs[index], 'active', true);
        } else {
          Vue.delete(stateContext.tabs, tabsIndex);
        }
      }
    }
  },
  [types.CLOSE_ALL_TABS](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const amount: number = payload.amount;

    if (amount === 1) {
      const index =
        stateContext.tabs.findIndex(tab => (
          tab.windowId === windowId
        ));
      if (stateContext.tabs[index].title !== 'error') {
        stateContext.lastOpenedTabs.unshift({
          title: stateContext.tabs[index].title,
          url: stateContext.tabs[index].url,
          favIconUrl: stateContext.tabs[index].favIconUrl,
          mtime: timeUtil.getMillisecondsTime(),
        });
      }
      Vue.delete(stateContext.tabs, index);
    } else {
      stateContext.tabs.forEach((tab, index) => {
        if (tab.windowId === windowId) {
          Vue.delete(stateContext.tabs, index);
        }
      });
    }
  },
  [types.CLICK_TAB](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    const tabIndex: number = payload.tabIndex;

    stateContext.tabs.forEach((tab, index) => {
      Vue.set(stateContext.tabs[index], 'highlighted', false);
      Vue.set(stateContext.tabs[index], 'active', false);
    });

    Vue.set(stateContext.currentTabIndexes, windowId, tabIndex);
    const index: number =
      stateContext.tabs.findIndex(tab => (
        tab.id === tabId
      ));
    Vue.set(stateContext.tabs[index], 'highlighted', true);
    Vue.set(stateContext.tabs[index], 'active', true);
  },
  // tab handlers
  [types.SET_BROWSER_VIEW_ID](stateContext: Lulumi.Store.State, payload: any): void {
    const browserViewId: number = payload.browserViewId;
    const tabId: number = payload.tabId;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].browserViewId = browserViewId;
    }
  },
  [types.DID_START_LOADING](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const webContentsId: number = payload.webContentsId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].webContentsId = webContentsId;
      stateContext.tabs[tabsIndex].url = url;
      stateContext.tabs[tabsIndex].isLoading = true;
      stateContext.tabs[tabsIndex].didNavigate = false;
      stateContext.tabs[tabsIndex].status = 'loading';
      stateContext.tabs[tabsIndex].error = false;

      // extensionsMetadata initilized
      Object.keys(stateContext.extensionInfoDict).forEach((extensionId) => {
        Vue.set(stateContext.tabs[tabsIndex].extensionsMetadata, extensionId, {
          browserActionIcon: '#',
          pageActionIcon: '#',
          badgeText: '',
          badgeBackgroundColor: '',
        });
      });
    }
  },
  [types.DID_NAVIGATE](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].didNavigate = true;
      stateContext.tabs[tabsIndex].title = url;
      stateContext.tabs[tabsIndex].hasMedia = false;
    }
  },
  [types.PAGE_TITLE_UPDATED](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const title: string = payload.title;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].title = title;
    }
  },
  [types.DOM_READY](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].canGoBack = payload.canGoBack;
      stateContext.tabs[tabsIndex].canGoForward = payload.canGoForward;
      stateContext.tabs[tabsIndex].canRefresh = true;
    }
  },
  [types.DID_FRAME_FINISH_LOAD](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;
    const regexp = new RegExp(/^lulumi(-extension)?:\/\/.+$/);

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex] && url) {
      if (stateContext.tabs[tabsIndex].title !== 'error') {
        stateContext.tabs[tabsIndex].url = url;
        stateContext.tabs[tabsIndex].error = false;
        if (url === 'chrome://gpu/') {
          stateContext.tabs[tabsIndex].title = urlUtil.getUrlIfPrivileged(url).title;
          stateContext.tabs[tabsIndex].favIconUrl = constants.tabConfig.lulumiDefault.tabFavicon;
        } else if (url.match(regexp)) {
          // lulumi://
          if (url.match(regexp)![1] === undefined) {
            stateContext.tabs[tabsIndex].title = urlUtil.getUrlIfPrivileged(url).title;
            // lulumi-extension://
          } else {
            stateContext.tabs[tabsIndex].statusText = false;
            stateContext.tabs[tabsIndex].canGoBack = payload.canGoBack;
            stateContext.tabs[tabsIndex].canGoForward = payload.canGoForward;
          }
          stateContext.tabs[tabsIndex].favIconUrl = constants.tabConfig.lulumiDefault.tabFavicon;
        } else {
          if (stateContext.tabs[tabsIndex].title === '') {
            stateContext.tabs[tabsIndex].title = stateContext.tabs[tabsIndex].url;
          }
          // history
          if (!((stateContext.tabs[tabsIndex].url.startsWith('file://') &&
            stateContext.tabs[tabsIndex].url.includes('/error/index.html')) ||
            stateContext.tabs[tabsIndex].url.startsWith('lulumi:blank'))) {
            const dates = timeUtil.getLocaleCurrentTime().split(' ');
            const mtime = timeUtil.getMillisecondsTime();
            const index =
              stateContext.history.findIndex(entry => (
                entry.url === stateContext.tabs[tabsIndex].url
              ));
            let entry: Lulumi.Store.TabHistory | null = null;
            if (index !== -1) {
              entry = stateContext.history.splice(index, 1)[0];
              entry.label = dates[0];
              entry.time = dates[1];
              entry.mtime = mtime;
            } else {
              entry = {
                mtime,
                title: stateContext.tabs[tabsIndex].title,
                url: stateContext.tabs[tabsIndex].url,
                favIconUrl: constants.tabConfig.lulumiDefault.tabFavicon,
                label: dates[0],
                time: dates[1],
              };
            }
            stateContext.history.unshift(entry);
          }
        }
      }
    }
  },
  [types.PAGE_FAVICON_UPDATED](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      const index =
        stateContext.history.findIndex(entry => (
          entry.url === stateContext.tabs[tabsIndex].url
        ));
      if (index !== -1) {
        stateContext.history[index].favIconUrl = url;
        stateContext.tabs[tabsIndex].favIconUrl = url;
      }
    }
  },
  [types.DID_STOP_LOADING](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex] && url) {
      stateContext.tabs[tabsIndex].url = url;
      stateContext.tabs[tabsIndex].canGoBack = payload.canGoBack;
      stateContext.tabs[tabsIndex].canGoForward = payload.canGoForward;
      stateContext.tabs[tabsIndex].statusText = false;
      stateContext.tabs[tabsIndex].isLoading = false;
      stateContext.tabs[tabsIndex].status = 'complete';
    }
  },
  [types.DID_FAIL_LOAD](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const isMainFrame: boolean = payload.isMainFrame;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex] && isMainFrame) {
      stateContext.tabs[tabsIndex].title = stateContext.tabs[tabsIndex].title || 'error';
      stateContext.tabs[tabsIndex].error = true;
    }
  },
  [types.UPDATE_TARGET_URL](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const url: string = payload.url;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].statusText = url;
    }
  },
  [types.MEDIA_STARTED_PLAYING](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const isAudioMuted: boolean = payload.isAudioMuted;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].hasMedia = true;
      stateContext.tabs[tabsIndex].isAudioMuted = isAudioMuted;
    }
  },
  [types.MEDIA_PAUSED](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].hasMedia = false;
    }
  },
  [types.TOGGLE_AUDIO](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const muted: boolean = payload.muted;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].isAudioMuted = muted;
    }
  },
  [types.UPDATE_CERTIFICATE](stateContext: Lulumi.Store.State, payload: any): void {
    const hostname: string = payload.hostname;
    const certificate: Electron.Certificate = payload.certificate;
    const verificationResult: string = payload.verificationResult;
    const errorCode: string = payload.errorCode;

    if (stateContext.certificates[hostname] === undefined) {
      Vue.set(stateContext.certificates, hostname, {});
    }

    Vue.set(stateContext.certificates[hostname]!, 'certificate', certificate);
    Vue.set(stateContext.certificates[hostname]!, 'verificationResult', verificationResult);
    Vue.set(stateContext.certificates[hostname]!, 'errorCode', errorCode);
  },
  [types.UPDATE_EXTENSION_METADATA](stateContext: Lulumi.Store.State, payload: any): void {
    const tabId: number = payload.tabId;
    const extensionId: string = payload.extensionId;
    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      const orig = stateContext.tabs[tabsIndex].extensionsMetadata[extensionId];
      if (payload.browserActionIcon) {
        orig.browserActionIcon = payload.browserActionIcon;
      }
      if (payload.pageActionIcon) {
        orig.pageActionIcon = payload.pageActionIcon;
      }
      if (payload.badgeText) {
        orig.badgeText = payload.badgeText;
      }
      if (payload.badgeBackgroundColor) {
        orig.badgeBackgroundColor = payload.badgeBackgroundColor;
      }
      Vue.set(stateContext.tabs[tabsIndex].extensionsMetadata, extensionId, orig);
    }
  },
  // preferences handlers
  [types.SET_CURRENT_SEARCH_ENGINE_PROVIDER](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    if (val.currentSearchEngine !== null) {
      stateContext.currentSearchEngine = val.currentSearchEngine;
    }
    stateContext.autoFetch = val.autoFetch;
  },
  [types.SET_HOMEPAGE](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    stateContext.homepage = val.homepage;
  },
  [types.SET_PDF_VIEWER](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    stateContext.pdfViewer = val.pdfViewer;
  },
  [types.SET_TAB_CONFIG](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    Vue.set(stateContext.tabConfig.lulumiDefault, 'tabFavicon', val.tabFavicon);
    Vue.set(stateContext.tabConfig.dummyTabObject, 'url', val.defaultUrl);
  },
  [types.SET_LANG](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    stateContext.lang = val.lang;
  },
  [types.SET_PROXY_CONFIG](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    Vue.set(stateContext.proxyConfig, 'pacScript', val.pacScript);
    Vue.set(stateContext.proxyConfig, 'proxyRules', val.proxyRules);
    Vue.set(stateContext.proxyConfig, 'proxyBypassRules', val.proxyBypassRules);
  },
  [types.SET_AUTH](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    Vue.set(stateContext.auth, 'username', val.username);
    Vue.set(stateContext.auth, 'password', val.password);
  },
  [types.SET_DOWNLOADS](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    stateContext.downloads = val;
  },
  [types.SET_HISTORY](stateContext: Lulumi.Store.State, { val }: { val: any }): void {
    stateContext.history = val;
  },
  [types.SET_TABS_ORDER](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const tabsOrder: string[] = payload.tabsOrder;
    if (tabsOrder.length !== 0) {
      Vue.set(stateContext.tabsOrder, windowId, tabsOrder.map(element => parseInt(element, 10)));
      // assigning new indexes to tabs
      const tabs = stateContext.tabs.filter(tab => tab.windowId === windowId);
      for (let index = 0; index < tabs.length; index += 1) {
        const tabsIndex: number =
          stateContext.tabs.findIndex(tab => (
            tabs[tabsOrder[index]].id === tab.id
          ));
        Vue.set(stateContext.tabs[tabsIndex], 'index', index);
      }
    }
  },
  [types.SET_PAGE_ACTION](stateContext: Lulumi.Store.State, payload: any): void {
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;
    const extensionId: string = payload.extensionId;
    const enabled: boolean = payload.enabled;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      if (stateContext.tabs[tabsIndex].pageActionMapping[extensionId]) {
        Vue.set(stateContext.tabs[tabsIndex].pageActionMapping[extensionId], 'enabled', enabled);
      } else {
        Vue.set(stateContext.tabs[tabsIndex].pageActionMapping, extensionId, {});
        Vue.set(stateContext.tabs[tabsIndex].pageActionMapping[extensionId], 'enabled', enabled);
      }
    }
  },
  [types.CLEAR_PAGE_ACTION](stateContext: Lulumi.Store.State, payload: any): void {
    // const windowId: number = payload.windowId;
    const tabId: number = payload.tabId;
    // const tabIndex: number = payload.tabIndex;

    const tabsIndex = stateContext.tabs.findIndex(tab => tab.id === tabId);

    if (stateContext.tabs[tabsIndex]) {
      stateContext.tabs[tabsIndex].pageActionMapping = {};
    }
  },
  // downloads handlers
  [types.CREATE_DOWNLOAD_TASK](stateContext: Lulumi.Store.State, payload: any): void {
    stateContext.downloads.unshift(payload);
  },
  [types.UPDATE_DOWNLOADS_PROGRESS](stateContext: Lulumi.Store.State, payload: any): void {
    const index =
      stateContext.downloads.findIndex(download => (
        download.startTime === payload.startTime
      ));
    if (index !== -1) {
      const download = stateContext.downloads[index];
      download.getReceivedBytes = payload.getReceivedBytes;
      download.savePath = payload.savePath;
      download.isPaused = payload.isPaused;
      download.canResume = payload.canResume;
      download.dataState = payload.dataState;
    }
  },
  [types.COMPLETE_DOWNLOADS_PROGRESS](stateContext: Lulumi.Store.State, payload: any): void {
    const index =
      stateContext.downloads.findIndex(download => (
        download.startTime === payload.startTime
      ));
    if (index !== -1) {
      const download = stateContext.downloads[index];
      if (download.savePath) {
        download.name = payload.name;
        download.dataState = payload.dataState;
      } else {
        stateContext.downloads.splice(index, 1);
      }
    }
  },
  [types.CLOSE_DOWNLOAD_BAR](stateContext: any): void {
    stateContext.downloads.forEach(download => (download.style = 'hidden'));
  },
  // permissions
  [types.SET_PERMISSIONS](stateContext: Lulumi.Store.State, payload: any): void {
    const hostname: string = payload.hostname;
    const permission: string = payload.permission;
    const accept: boolean = payload.accept;
    if (stateContext.permissions[hostname] === undefined) {
      Vue.set(stateContext.permissions, hostname, {});
    }

    Vue.set(stateContext.permissions[hostname], permission, accept);
  },
  // set state
  [types.SET_LULUMI_STATE](stateContext: Lulumi.Store.State, { newState }: { newState: any }): void {
    stateContext.tabId = newState.pid;
    stateContext.tabs = newState.tabs;
    stateContext.currentTabIndexes = newState.currentTabIndexes;
    stateContext.searchEngine = constants.searchEngine;
    stateContext.currentSearchEngine = newState.currentSearchEngine;
    stateContext.autoFetch = newState.autoFetch;
    stateContext.homepage = newState.homepage;
    stateContext.pdfViewer = newState.pdfViewer;
    stateContext.tabConfig = newState.tabConfig;
    stateContext.lang = newState.lang;
    stateContext.proxyConfig = newState.proxyConfig;
    stateContext.downloads = newState.downloads;
    stateContext.history = newState.history;
    stateContext.lastOpenedTabs = newState.lastOpenedTabs;
    stateContext.windows = newState.windows;
  },
  // window state
  [types.CREATE_WINDOW](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const width: number = payload.width;
    const height: number = payload.height;
    const left: number = payload.left;
    const top: number = payload.top;
    const windowState: string = payload.windowState;
    const type: string = payload.type;

    stateContext.windows.forEach(
      (_, index) => Vue.set(stateContext.windows[index], 'lastActive', false)
    );
    const windowsIndex: number = stateContext.windows.findIndex(window => window.id === windowId);
    if (windowsIndex === -1) {
      stateContext.windows.push({
        id: windowId,
        width,
        height,
        left,
        top,
        state: windowState,
        type,
        lastActive: true,
      });
    } else {
      Vue.set(stateContext.windows, windowsIndex, {
        id: windowId,
        width,
        height,
        left,
        top,
        state: windowState,
        type,
        lastActive: true,
      });
    }
  },
  [types.CLOSE_WINDOW](stateContext: Lulumi.Store.State, { windowId }: { windowId: number }): void {
    const index: number = stateContext.windows.findIndex(window => (window.id === windowId));
    if (index !== -1) {
      if (stateContext.windows[index].lastActive) {
        const keys = Object.keys(stateContext.windows);
        Vue.set(stateContext.windows[parseInt(keys[keys.length - 1], 10)], 'lastActive', true);
      }
      Vue.delete(stateContext.windows, index);
    }
  },
  [types.UPDATE_WINDOW_PROPERTY](stateContext: Lulumi.Store.State, payload: any): void {
    const windowId: number = payload.windowId;
    const width: number = payload.width;
    const height: number = payload.height;
    const left: number = payload.left;
    const top: number = payload.top;
    const focused: boolean = payload.focused;
    const windowState: string = payload.windowState;
    const wid: number = stateContext.windows.findIndex(window => (window.id === windowId));
    if (wid !== -1) {
      Vue.set(stateContext.windows[wid], 'width', width);
      Vue.set(stateContext.windows[wid], 'height', height);
      Vue.set(stateContext.windows[wid], 'left', left);
      Vue.set(stateContext.windows[wid], 'top', top);
      Vue.set(stateContext.windows[wid], 'focused', focused);
      Vue.set(stateContext.windows[wid], 'stateContext', windowState);
      if (focused) {
        stateContext.windows.forEach((window, index) => {
          Vue.set(stateContext.windows[index], 'lastActive', false);
        });
        Vue.set(stateContext.windows[wid], 'lastActive', true);
      }
    }
  },
  // extensions
  [types.ADD_EXTENSION](stateContext: Lulumi.Store.State, payload: any): void {
    const extensionInfo: chrome.management.ExtensionInfo = payload.extensionInfo;
    if (stateContext.extensionInfoDict[extensionInfo.id] === undefined) {
      Vue.set(stateContext.extensionInfoDict, extensionInfo.id, extensionInfo);
      stateContext.tabs.forEach((_, index) => {
        Vue.set(stateContext.tabs[index].extensionsMetadata, extensionInfo.id, {
          browserActionIcon: '#',
          pageActionIcon: '#',
          badgeText: '',
          badgeBackgroundColor: '',
        });
      });
    }
  },
  [types.REMOVE_EXTENSION](stateContext: Lulumi.Store.State, payload: any): void {
    const extensionId: string = payload.extensionId;
    Vue.delete(stateContext.extensionInfoDict, extensionId);
    stateContext.tabs.forEach((_, index) => {
      Vue.delete(stateContext.tabs[index].extensionsMetadata, extensionId);
    });
  },
  [types.UPDATE_EXTENSION](stateContext: Lulumi.Store.State, payload: any): void {
    const enabled: boolean = payload.enabled;
    const extensionId: string = payload.extensionId;
    const extensionInfo = stateContext.extensionInfoDict[extensionId];
    if (extensionInfo !== undefined) {
      extensionInfo.enabled = enabled;
      Vue.set(stateContext.extensionInfoDict, extensionId, extensionInfo);
    }
  },
};

export default {
  state,
  mutations,
};
