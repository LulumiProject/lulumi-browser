interface BrowserState extends State {
  browser: State;
}

export const getters = {
  pid(state: BrowserState): number {
    return state.browser.pid;
  },
  pages(state: BrowserState): PageObject[] {
    return state.browser.pages;
  },
  tabsOrder(state: BrowserState) {
    return state.browser.tabsOrder;
  },
  currentPageIndex(state: BrowserState) {
    return state.browser.currentPageIndex;
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
  mappings(state: BrowserState) {
    return state.browser.mappings;
  },
};
