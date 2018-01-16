import { nativeImage } from 'electron';
import { fixPathForAsarUnpack } from 'electron-util';
import * as path from 'path';

import { store } from 'lulumi';

declare const __static;

const searchEngine = [
  {
    name: 'Google',
    search: 'https://www.google.com/search?q={queryString}',
    autocomplete:
      'http://suggestqueries.google.com/complete/search?client=chrome&q={queryString}',
  },
  {
    name: 'Bing',
    search: 'https://www.bing.com/search?q={queryString}',
    autocomplete:
      'http://api.bing.com/osjson.aspx?query={queryString}&language={language}',
  },
  {
    name: 'Yahoo!',
    search: 'http://search.yahoo.com/search?fr=crmas&p={queryString}',
    autocomplete:
      'http://ff.search.yahoo.com/gossip?output=fxjson&command={queryString}',
  },
  {
    name: 'Yahoo! UK & Ireland',
    search: 'http://uk.search.yahoo.com/search?fr=crmas&p={queryString}',
    autocomplete:
      'http://uk-sayt.ff.search.yahoo.com/gossip-uk-sayt?output=fxjson&command={queryString}',
  },
  {
    name: 'Yahoo! JAPAN',
    search: 'http://search.yahoo.co.jp/search?fr=crmas&p={queryString}',
    autocomplete:
      // tslint:disable-next-line max-line-length
      'http://search.yahooapis.jp/AssistSearchService/V2/webassistSearch?appid=oQsoxcyxg66enp0TYoirkKoryq6rF8bK76mW0KYxZ0v0WPLtn.Lix6wy8F_LwGWHUII-&output=iejson&p={queryString}',
  },
  {
    name: 'Daum',
    search: 'http://search.daum.net/search?q={queryString}',
    autocomplete:
      'http://sug.search.daum.net/search_nsuggest?mod=fxjson&q={queryString}',
  },
  {
    name: 'Naver',
    search: 'http://search.naver.com/search.naver?query={queryString}',
    autocomplete:
      'http://ac.search.naver.com/nx/ac?of=os&oe=utf-8&q={queryString}',
  },
];

const homepage = 'https://github.com/LulumiProject/lulumi-browser';
const pdfViewer = 'pdf-viewer';

const tabConfig: store.TabConfig = {
  dummyTabObject: {
    webContentsId: -1,
    id: -1,
    index: -1,
    windowId: -1,
    highlighted: false,
    active: false,
    pinned: false,
    url: 'https://github.com/LulumiProject/lulumi-browser',
    title: null,
    favIconUrl: null,
    status: null,
    incognito: false,
    statusText: false,
    isLoading: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false,
    error: false,
    hasMedia: false,
    isAudioMuted: false,
    pageActionMapping: {},
  },
  defaultFavicon: nativeImage
    .createFromPath(fixPathForAsarUnpack(path.join(__static, 'icons', 'document.png')))
    .toDataURL(),
  lulumiFavicon: nativeImage
    .createFromPath(fixPathForAsarUnpack(path.join(__static, 'icons', 'icon.png')))
    .toDataURL(),
};

export default {
  tabConfig,
  searchEngine,
  homepage,
  pdfViewer,
  lulumiPagesCustomProtocol: 'lulumi://',
  aboutPages: {
    about: 'List of about pages',
  },
  currentSearchEngine: searchEngine[0],
  autoFetch: false,
};
