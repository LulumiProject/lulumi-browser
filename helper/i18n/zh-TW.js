export const appMenu = {
  app: {
    about: '關於 %{appName}',
    services: {
      title: '服務',
    },
    hide: '隱藏 %{appName}',
    hideOthers: '隱藏其他',
    unhide: '全部顯示',
    quit: '離開 %{appName}',
  },
  file: {
    title: '檔案',
    newTab: '新增分頁',
    newWindow: '新增視窗',
    closeTab: '關閉分頁',
  },
  edit: {
    title: '編輯',
    undo: '還原輸入',
    redo: '重做',
    cut: '剪下',
    copy: '複製',
    paste: '貼上',
    pasteAndMatchStyle: '貼上並符合樣式',
    delete: '刪除',
    selectAll: '全選',
    find: '尋找',
    speech: {
      title: '語音',
      startSpeaking: '開始',
      stopSpeaking: '暫停',
    },
  },
  view: {
    title: '檢視',
    reload: '重新載入此網頁',
    forceReload: '強制重新載入此網頁',
    toggleFullscreen: '進入全螢幕',
    resetZoom: '實際大小',
    zoomIn: '放大',
    zoomOut: '縮小',
    viewSource: '檢視網頁原始碼',
    toggleDevTools: '開發人員工具',
    javascriptPanel: 'JavaScript 控制台',
  },
  window: {
    title: '視窗',
    minimize: '最小化',
    close: '關閉視窗',
    front: '全部移至最上層',
    processManager: '工作管理員',
  },
  help: {
    title: '說明',
    reportIssue: '回報問題',
    forceReload: '強制重新載入',
    toggleDevTools: '開發人員工具',
  },
};

export const guest = {
  about: {
    aboutPage: '關於頁面',
    downloadsPage: {
      title: '下載',
      clear: '清除',
    },
    lulumiPage: {
      title: '關於 Lulumi',
      item: '項目',
      value: '值',
    },
    preferencesPage: {
      searchEngineProviderPage: {
        title: '搜尋引擎提供者',
        current: '現在',
        searchEngine: '搜尋引擎',
        name: '提供者',
      },
      homePage: {
        title: '首頁',
        homepage: '首頁',
      },
      pdfViewerPage: {
        title: 'PDF瀏覽器',
      },
      tabConfigPage: {
        title: '分頁',
        url: '預設開啟',
        favicon: '預設圖示',
      },
      LanguagePage: {
        title: '語言',
      },
    },
    historyPage: {
      title: '歷史紀錄',
      clear: '清除',
      sync: '紀錄',
      syncStatus: {
        syncing: '同步中',
        notSyncing: '非同步',
      },
      placeholder: '關鍵字',
      noData: '無紀錄',
    },
    extensionsPage: {
      title: '擴充套件',
      add: '新增',
      path: '位置：',
    },
    newtabPage: {
      title: '新分頁',
    },
  },
};

export default {
  file: {
    newTab: '新增分頁',
    newWindow: '新增視窗',
  },
  window: {
    processManager: '工作管理員',
  },
  help: {
    reportIssue: '回報問題',
    forceReload: '強制重新載入',
    toggleDevTools: '開發人員工具',
  },
  webview: {
    contextMenu: {
      back: '上一頁',
      forward: '下一頁',
      reload: '重新載入',
      undo: '還原',
      redo: '重做',
      cut: '剪下',
      copy: '複製',
      paste: '貼上',
      pasteAndMatchStyle: '貼上並符合樣式',
      selectAll: '選取全部',
      openLinkInNewTab: '在新分頁中開啟連結',
      openLinkInNewWindow: '在新視窗中開啟連結',
      copyLinkAddress: '複製連結網址',
      saveImageAs: '另存圖片...',
      copyImage: '複製圖片',
      copyImageUrl: '複製圖片位址',
      openImageInNewTab: '在新分頁中開啟圖片',
      searchFor: '透過 %{searchEngine} 搜尋「%{selectionText}」',
      lookUp: '查詢「%{selectionText}」',
      viewSource: '檢視網頁原始碼',
      inspectElement: '檢查',
      javascriptPanel: 'JavaScript 控制台',
    },
  },
  downloads: {
    state: {
      init: '準備中',
      progressing: '下載中',
      cancelled: '已取消',
      completed: '已完成',
    },
  },
  navbar: {
    placeholder: '輸入 URL 搜尋',
    search: '搜尋',
    indicator: {
      secure: '安全',
      insecure: '不安全',
    },
    navigator: {
      history: '顯示完整紀錄',
    },
    contextMenu: {
      cut: '剪下',
      copy: '複製',
      paste: '貼上',
      pasteAndGo: '貼上並搜尋',
    },
    common: {
      options: {
        preferences: '設定',
        downloads: '下載',
        history: {
          title: '紀錄',
          history: '紀錄',
          recentlyClosed: '最近關閉的分頁',
          tabs: '%{amount} 個分頁',
        },
        extensions: '擴充功能',
        help: '說明',
        lulumi: '關於 Lulumi',
      },
    },
  },
  notification: {
    update: {
      updateAvailable: '新版本，%{releaseName}，已經下載完畢。重新啟動以進行安裝？',
    },
    permission: {
      request: {
        normal: '%{hostname} 要求 %{permission} 權限.',
        setLanguage: '%{hostname} 想要更改語言至 %{lang}（需重啟）',
        permanent: '記住我的選擇',
        allow: '允許',
        deny: '拒絕',
      },
    },
  },
  tab: {
    loading: '載入中',
    findInPage: {
      placeholder: '在頁面中尋找',
      of: '/',
      match: '匹配',
      status: '%{activeMatch} @:tab.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: '載入中',
    contextMenu: {
      newTab: '新增分頁',
      duplicateTab: '複製分頁',
      closeTab: '關閉分頁',
    },
  },
};
