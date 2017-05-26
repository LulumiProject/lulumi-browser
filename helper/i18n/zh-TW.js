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
        location: '預設開啟',
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
  webview: {
    contextMenu: {
      undo: '還原',
      redo: '重做',
      cut: '剪下',
      copy: '複製',
      paste: '貼上',
      pasteAndMatchStyle: '貼上並符合樣式',
      selectAll: '選取全部',
      openLinkInNewTab: '在新分頁中開啟連結',
      copyLinkAddress: '複製連結網址',
      saveImageAs: '另存圖片...',
      copyImageUrl: '複製圖片位址',
      openImageInNewTab: '在新分頁中開啟圖片',
      searchFor: '透過 %{searchEngine} 搜尋「%{selectionText}」',
      lookUp: '查詢「%{selectionText}」',
      viewSource: '檢視網頁原始碼',
      inspectElement: '檢查',
    },
  },
  downloads: {
    state: {
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
      insecure: '一般',
    },
    cascader: {
      options: {
        preferences: '設定',
        downloads: '下載',
        history: '紀錄',
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
        allow: '允許',
        deny: '拒絕',
      },
    },
  },
  page: {
    loading: '載入中',
    findInPage: {
      placeholder: '在頁面中尋找',
      of: '/',
      match: '匹配',
      status: '%{activeMatch} @:page.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: '載入中',
  },
};
