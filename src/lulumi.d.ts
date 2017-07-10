// *.vue
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
};

// extension api
interface GlobalObject extends NodeJS.Global {
  wid: number;
  renderProcessPreferences: Array<any>;
}
interface CustomBrowserWindow extends Electron.BrowserWindow {
  addExtension(srcDirectory: string): void;
}

// store
interface PageObject {
  pid: number;
  location: string;
  statusText: boolean;
  favicon: string | null;
  title: string | null;
  isLoading: boolean;
  isSearching: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  canRefresh: boolean;
  error: boolean;
  hasMedia: boolean;
  isAudioMuted: boolean;
  pageActionMapping: object;
}
interface PageObjectList extends Array<PageObject> {
  [index: number]: PageObject;
  length: number;
}
interface TabConfig {
  defaultUrl: string;
  defaultFavicon: string;
  lulumiFavicon: string;
}
interface SearchEngineObject {
  name: string;
  search: string;
  autocomplete: string;
}
interface LastOpenedTabObject {
  title: string;
  url: string;
  favicon: string | null;
}
interface State {
  pid: number;
  pages: PageObjectList;
  tabsOrder: Array<number>;
  currentPageIndex: number;
  searchEngine: Array<SearchEngineObject>;
  currentSearchEngine: SearchEngineObject;
  homepage: string;
  pdfViewer: string;
  tabConfig: TabConfig;
  lang: string;
  downloads: Array<object>;
  history: Array<object>;
  permissions: object;
  mappings: Array<number>;
  lastOpenedTabs: Array<LastOpenedTabObject>;
}

// src/renderer/js
interface SuggestionObject {
  title?: string;
  value: string;
  icon: string;
}
interface AboutLocationObject {
  title: string;
  url: string;
}
