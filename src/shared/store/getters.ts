/* eslint-disable import/prefer-default-export */

import { Config } from 'electron';

interface BrowserState extends Lulumi.Store.State {
  browser: Lulumi.Store.State;
}

export const getters = {
  pid(state: BrowserState): number {
    return state.browser.tabId;
  },
  tabs(state: BrowserState): Lulumi.Store.TabObject[] {
    return state.browser.tabs;
  },
  tabsOrder(state: BrowserState): number[][] {
    return state.browser.tabsOrder;
  },
  currentTabIndexes(state: BrowserState): number[] {
    return state.browser.currentTabIndexes;
  },
  searchEngine(state: BrowserState): Lulumi.Store.SearchEngineObject[] {
    return state.browser.searchEngine;
  },
  currentSearchEngine(state: BrowserState): Lulumi.Store.SearchEngineObject {
    return state.browser.currentSearchEngine;
  },
  autoFetch(state: BrowserState): boolean {
    return state.browser.autoFetch;
  },
  homepage(state: BrowserState): string {
    return state.browser.homepage;
  },
  pdfViewer(state: BrowserState): string {
    return state.browser.pdfViewer;
  },
  tabConfig(state: BrowserState): Lulumi.Store.TabConfig {
    return state.browser.tabConfig;
  },
  lang(state: BrowserState): string {
    return state.browser.lang;
  },
  proxyConfig(state: BrowserState): Config {
    return state.browser.proxyConfig;
  },
  auth(state: BrowserState): { username: string; password: string } {
    return state.browser.auth;
  },
  downloads(state: BrowserState): Lulumi.Store.DownloadItem[] {
    return state.browser.downloads;
  },
  history(state: BrowserState): Lulumi.Store.TabHistory[] {
    return state.browser.history;
  },
  lastOpenedTabs(state: BrowserState): Lulumi.Store.LastOpenedTabObject[] {
    return state.browser.lastOpenedTabs;
  },
  permissions(state: BrowserState): any {
    return state.browser.permissions;
  },
  certificates(state: BrowserState): Lulumi.Store.Certificates {
    return state.browser.certificates;
  },
  windows(state: BrowserState): Lulumi.Store.LulumiBrowserWindowProperty[] {
    return state.browser.windows;
  },
  extensionInfoDict(state: BrowserState): Lulumi.Store.ExtensionInfoDict {
    return state.browser.extensionInfoDict;
  },
};
