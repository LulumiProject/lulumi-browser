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
interface SuggestionObject {
  title?: string;
  value: string;
  icon: string;
}
interface AboutLocationObject {
  title: string;
  url: string;
}
