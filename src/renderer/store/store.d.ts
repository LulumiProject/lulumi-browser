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
interface TabConfig {
  defaultUrl: string;
  defaultFavicon: string;
  lulumiFavicon: string;
}
interface State {
  pid: number;
  pages: Array<PageObject>;
  tabsOrder: Array<number>;
  currentPageIndex: number;
  searchEngine: Array<object>;
  currentSearchEngine: object;
  homepage: string;
  pdfViewer: string;
  tabConfig: TabConfig;
  lang: string;
  downloads: Array<object>;
  history: Array<object>;
  permissions: object;
  mappings: Array<number>;
  lastOpenedTabs: Array<object>;
}
