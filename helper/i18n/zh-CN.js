export const appMenu = {
  app: {
    about: '关于 %{appName}',
    services: {
      title: '服务',
    },
    hide: '隐藏 %{appName}',
    hideOthers: '隐藏其他',
    unhide: '全部显示',
    quit: '退出 %{appName}',
  },
  file: {
    title: '文件',
    newTab: '新标签页',
    newWindow: '新建窗口',
    closeTab: '关闭标签页',
  },
  edit: {
    title: '编辑',
    undo: '撤销',
    redo: '恢复',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    pasteAndMatchStyle: '粘贴并匹配格式',
    delete: '删除',
    selectAll: '选择全部',
    find: '查找',
    speech: {
      title: '拼写',
      startSpeaking: '开始拼写',
      stopSpeaking: '停止拼写',
    },
  },
  view: {
    title: '视图',
    reload: '重新加载',
    forceReload: '完全重载',
    toggleFullscreen: '进入全屏幕',
    resetZoom: '实际大小',
    zoomIn: '放大',
    zoomOut: '缩小',
    viewSource: '显示网页源代码',
    toggleDevTools: '开发者工具',
  },
  window: {
    title: '窗口',
    minimize: '最小化',
    close: '关闭窗口',
    front: '全部置于顶层',
    processManager: '任务管理器',
  },
  help: {
    title: '帮助',
    reportIssue: '报告问题',
    forceReload: '重新启动',
    toggleDevTools: '切换开发者工具',
  },
};

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
        current: '当前使用',
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
        url: '默认开启',
        favicon: '图标',
      },
      LanguagePage: {
        title: '语言',
      },
    },
    historyPage: {
      title: '历史记录',
      clear: '清空',
      sync: '记录',
      syncStatus: {
        syncing: '同步中',
        notSyncing: '非同步',
      },
      placeholder: '关键字',
      noData: '无纪录',
    },
    extensionsPage: {
      title: '扩展程序',
      add: '添加',
      path: '位置：',
    },
    newtabPage: {
      title: '新标签页',
    },
  },
};

export default {
  webview: {
    contextMenu: {
      back: 'Back',
      forward: 'Forward',
      reload: 'Reload',
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
      init: '初始化中',
      progressing: '下载中',
      cancelled: '已取消',
      completed: '已完成',
    },
  },
  navbar: {
    placeholder: '输入地址搜索',
    search: '搜索',
    indicator: {
      secure: '安全',
      insecure: '一般',
    },
    navigator: {
      history: 'Show history',
    },
    contextMenu: {
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      pasteAndGo: 'Paste and Go',
    },
    common: {
      options: {
        preferences: '设置',
        downloads: '下载',
        history: {
          title: '历史记录',
          history: '所有历史记录',
        },
        extensions: '扩展程序',
        help: '帮助',
        lulumi: '关于 Lulumi',
      },
    },
  },
  notification: {
    update: {
      updateAvailable: '新版本，%{releaseName}，已经下载完毕。重启执行安装？',
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
  tab: {
    loading: '载入中',
    findInPage: {
      placeholder: '查找',
      of: '/',
      match: '符合',
      status: '%{activeMatch} @:tab.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: '载入中',
    contextMenu: {
      newTab: 'New Tab',
      duplicateTab: 'Duplicate Tab',
      closeTab: 'Close Tab',
    },
  },
};
