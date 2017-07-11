// *.vue
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

// lulumi:// scheme
interface LulumiObject extends Object {
  lulumi: object[];
  preferences: string[][];
  about: string[][];
}

// extension api
interface BackgroundPageObject {
  html: string;
  name: string;
  webContentsId: number;
}
interface BackgroundPages {
  [index: string]: BackgroundPageObject;
}
interface ManifestObject extends chrome.runtime.Manifest {
  extensionId: string;
  manifest_version?: string;
  version?: string;
}
interface ManifestMap {
  [index: string]: ManifestObject
}
interface ManifestNameMap {
  [index: string]: ManifestObject
}
interface GlobalObject extends NodeJS.Global {
  online: boolean;
  wid: number;
  __static: string;
  renderProcessPreferences: any[];
  backgroundPages: BackgroundPages;
  manifestMap: ManifestMap;
  manifestNameMap: ManifestNameMap;
  guestData: LulumiObject;
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
  tabsOrder: number[];
  currentPageIndex: number;
  searchEngine: SearchEngineObject[];
  currentSearchEngine: SearchEngineObject;
  homepage: string;
  pdfViewer: string;
  tabConfig: TabConfig;
  lang: string;
  downloads: object[];
  history: object[];
  permissions: object;
  mappings: number[];
  lastOpenedTabs: LastOpenedTabObject[];
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
