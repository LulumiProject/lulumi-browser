# Vuex

Lulumi browser takes advantage of using [vuex](https://github.com/vuejs/vuex) to store lots of information. If you are not familiar with it, I suggest taking a look at its [guide](https://vuex.vuejs.org/).

# appState

```javascript
{
  tabId: number,
  tabs: {
    id: number,
    windowId: number,
    url: string,
    statusText: string | boolean,
    favicon: string | null,
    title: string | null,
    isLoading: boolean,
    isSearching: boolean,
    canGoBack: boolean,
    canGoForward: boolean,
    canRefresh: boolean,
    error: boolean,
    hasMedia: boolean,
    isAudioMuted: boolean,
    pageActionMapping: {
      extensionId: {
        enabled: boolean,
      },
    },
  },
  currentTabIndexes: number[],
  currentSearchEngine: {
    name: string, // 'Google'
    search: string, // 'https://www.google.com/search?q='
    autocomplete: string, // 'https://suggestqueries.google.com/complete/search?client=youtube&q='
  },
  homepage: string,
  pdfViewer: string, // 'pdf-viewer' or 'PDF.js'
  tabConfig: {
    defaultUrl: string,
    defaultFavicon: string,
    lulumiFavicon: string,
  },
  lang: string, // 'en', 'zh-CN, 'zh-TW'
  downloads: [{
    getReceivedBytes: number,
    totalBytes: number,
    startTime: number,
    webContentsId: number,
    name: string,
    url: string,
    isPaused: boolean,
    canResume: boolean,
    state: string,
    savePath: string | null,
    dataState: string,
  }],
  history: [{
    title: string,
    url: string,
    favicon: string,
    label: string,
    time: string,
  }],
  windows: [{
    id: number,
    width: number,
    height: number,
    left: number,
    top: number,
    focused: boolean,
    state: string,
    type: string,
  }],
}
```
