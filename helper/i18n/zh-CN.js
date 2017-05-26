export const guest = {
  about: {
    aboutPage: '关于',
    downloadsPage: {
      title: '下载',
      clear: '清空',
    },
    lulumiPage: {
      title: '关于 Lulumi',
      item: '项目',
      value: '值',
    },
    preferencesPage: {
      searchEngineProviderPage: {
        title: '搜索引擎提供者',
        current: '这刻',
        searchEngine: '搜索引擎',
        name: '提供者',
      },
      homePage: {
        title: '首页',
        homepage: '首页',
      },
      pdfViewerPage: {
        title: 'PDF浏览器',
      },
      tabConfigPage: {
        title: '分页',
        location: '默认开启',
        favicon: '默认图示',
      },
      LanguagePage: {
        title: '语言',
      },
    },
    historyPage: {
      title: '历史纪录',
      clear: '清空',
      sync: '纪录',
      syncStatus: {
        syncing: '同步中',
        notSyncing: '非同步',
      },
      placeholder: '关键字',
      noData: '无纪录',
    },
    extensionsPage: {
      title: '扩充组件',
      add: '添加',
      path: '位置：',
    },
    newtabPage: {
      title: 'Newtab',
    },
  },
};

export default {
  webview: {
    contextMenu: {
      undo: 'Undo',
      redo: 'Redo',
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      pasteAndMatchStyle: 'Paste and Match Style',
      selectAll: 'Select All',
      openLinkInNewTab: 'Open Link in New Tab',
      copyLinkAddress: 'Copy Link Address',
      saveImageAs: 'Save Image As...',
      copyImageUrl: 'Copy Image URL',
      openImageInNewTab: 'Open Image in New Tab',
      searchFor: 'Search %{searchEngine} for "%{selectionText}"',
      lookUp: 'Look up "%{selectionText}"',
      viewSource: 'View Source',
      inspectElement: 'Inspect Element',
    },
  },
  downloads: {
    state: {
      progressing: '下载中',
      cancelled: '已取消',
      completed: '已完成',
    },
  },
  navbar: {
    placeholder: '键入 URL 搜寻',
    search: '搜寻',
    indicator: {
      secure: '安全',
      insecure: '一般',
    },
    cascader: {
      options: {
        preferences: '设定',
        downloads: '下载',
        history: '纪录',
        extensions: '扩充功能',
        help: '帮助',
        lulumi: '关于 Lulumi',
      },
    },
  },
  notification: {
    update: {
      updateAvailable: '新版本，%{releaseName}，已经下载完毕。重启后进行安装？',
    },
    permission: {
      request: {
        normal: '%{hostname} 要求 %{permission} 权限.',
        setLanguage: '%{hostname} 想要变更语言成 %{lang}（需重启）',
        allow: '允许',
        deny: '拒绝',
      },
    },
  },
  page: {
    loading: '载入中',
    findInPage: {
      placeholder: '在页面中找寻',
      of: '/',
      match: '符合',
      status: '%{activeMatch} @:page.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: '载入中',
  },
};
