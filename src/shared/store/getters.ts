import { store } from 'lulumi';

interface BrowserState extends store.State {
  browser: store.State;
}

export const getters = {
  pid(state: BrowserState): number {
    return state.browser.tabId;
  },
  tabs(state: BrowserState): store.TabObject[] {
    return state.browser.tabs;
  },
  tabsOrder(state: BrowserState) {
    return state.browser.tabsOrder;
  },
  currentTabIndexes(state: BrowserState) {
    return state.browser.currentTabIndexes;
  },
  searchEngine(state: BrowserState) {
    return state.browser.searchEngine;
  },
  currentSearchEngine(state: BrowserState) {
    return state.browser.currentSearchEngine;
  },
  homepage(state: BrowserState) {
    return state.browser.homepage;
  },
  pdfViewer(state: BrowserState) {
    return state.browser.pdfViewer;
  },
  tabConfig(state: BrowserState) {
    return state.browser.tabConfig;
  },
  lang(state: BrowserState) {
    return state.browser.lang;
  },
  downloads(state: BrowserState) {
    return state.browser.downloads;
  },
  history(state: BrowserState) {
    return state.browser.history;
  },
  lastOpenedTabs(state: BrowserState) {
    return state.browser.lastOpenedTabs;
  },
  permissions(state: BrowserState) {
    return state.browser.permissions;
  },
  certificates(state: BrowserState) {
    return state.browser.certificates;
  },
  windows(state: BrowserState) {
    return state.browser.windows;
  },
};
