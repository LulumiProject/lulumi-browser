import { nativeImage } from 'electron';
import { fixPathForAsarUnpack } from 'electron-util';
import path from 'path';

import { store } from 'lulumi';

declare const __static;

const searchEngine = [
  {
    name: 'Google',
    search: 'https://www.google.com/search?q=',
    autocomplete: 'https://suggestqueries.google.com/complete/search?client=youtube&q=',
  },
  {
    name: 'Bing',
    search: 'https://www.bing.com/search?q=',
    autocomplete: 'https://api.bing.com/osjson.aspx?query=',
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
};
