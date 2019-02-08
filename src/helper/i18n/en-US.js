export const appMenu = {
  app: {
    about: 'About %{appName}',
    services: {
      title: 'Services',
    },
    hide: 'Hide %{appName}',
    hideOthers: 'Hide Others',
    unhide: 'Show All',
    quit: 'Quit %{appName}',
  },
  file: {
    title: 'File',
    newTab: 'New Tab',
    newWindow: 'New Window',
    closeTab: 'Close Tab',
  },
  edit: {
    title: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteAndMatchStyle: 'Paste and Match Style',
    delete: 'Delete',
    selectAll: 'Select All',
    find: 'Find',
    speech: {
      title: 'Speech',
      startSpeaking: 'Start Speaking',
      stopSpeaking: 'Stop Speaking',
    },
  },
  view: {
    title: 'View',
    reload: 'Reload',
    forceReload: 'Force Reload',
    toggleFullscreen: 'Toggle Fullscreen',
    resetZoom: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    viewSource: 'View Source',
    toggleDevTools: 'Toggle Developer Tools',
    javascriptPanel: 'JavaScript Panel',
  },
  window: {
    title: 'Window',
    minimize: 'Minimize',
    close: 'Close Window',
    selectNextTab: 'Select Next Tab',
    selectPreviousTab: 'Select Previous Tab',
    processManager: 'Process Manager',
    front: 'Bring All to Front',
  },
  help: {
    title: 'Help',
    reportIssue: 'Report Issue',
    forceReload: 'Force Reload',
    toggleDevTools: 'Toggle Developer Tools',
  },
};

export const guest = {
  about: {
    aboutPage: {
      title: 'About Page',
    },
    downloadsPage: {
      title: 'Downloads',
      clear: 'Clear',
    },
    lulumiPage: {
      title: 'About Lulumi',
      item: 'item',
      value: 'value',
    },
    preferencesPage: {
      searchEngineProviderPage: {
        title: 'Preferences / Search Engine Provider Page',
        current: 'Current',
        searchEngine: 'Search Engine',
        name: 'Name',
        options: 'Search Bar Options',
        autoFetch: 'Autocomplete query string (autosuggestion)',
      },
      homePage: {
        title: 'Preferences / Homepage',
        homepage: 'homepage',
      },
      pdfViewerPage: {
        title: 'Preferences / PDFViewer',
      },
      tabConfigPage: {
        title: 'Preferences / Tab',
        url: 'Opening Url',
        favicon: 'Default Favicon',
      },
      LanguagePage: {
        title: 'Preferences / Language',
      },
    },
    historyPage: {
      title: 'History',
      clear: 'Clear',
      sync: 'History is',
      syncStatus: {
        syncing: 'syncing',
        notSyncing: 'not syncing',
      },
      placeholder: 'Input keyword',
      noData: 'No data',
    },
    extensionsPage: {
      title: 'Extensions',
      add: 'Add',
      path: 'Path:',
    },
    newtabPage: {
      title: 'Newtab',
    },
  },
};

export default {
  file: {
    newTab: 'New Tab',
    newWindow: 'New Window',
  },
  window: {
    processManager: 'Process Manager',
  },
  help: {
    reportIssue: 'Report Issue',
    forceReload: 'Force Reload',
    toggleDevTools: 'Toggle Developer Tools',
  },
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
      openLinkInNewWindow: 'Open Link in New Window',
      copyLinkAddress: 'Copy Link Address',
      saveImageAs: 'Save Image As...',
      copyImage: 'Copy Image',
      copyImageUrl: 'Copy Image URL',
      openImageInNewTab: 'Open Image in New Tab',
      searchFor: 'Search %{searchEngine} for "%{selectionText}"',
      lookUp: 'Look up "%{selectionText}"',
      viewSource: 'View Source',
      inspectElement: 'Inspect Element',
      javascriptPanel: 'JavaScript Panel',
    },
  },
  downloads: {
    state: {
      init: 'init',
      progressing: 'progressing',
      cancelled: 'cancelled',
      completed: 'completed',
    },
  },
  navbar: {
    placeholder: 'Enter a URL or search a term',
    search: 'Search',
    indicator: {
      secure: 'Secure',
      insecure: 'Not Secure',
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
    extensions: {
      contextMenu: {
        inspectElement: 'Inspect Element',
        manage: 'Manage Extensions',
        remove: 'Remove extension',
      },
    },
    common: {
      options: {
        preferences: 'Preferences',
        downloads: 'Downloads',
        history: {
          title: 'History',
          history: 'History',
          recentlyClosed: 'Recently closed',
          tabs: '%{amount} tabs',
        },
        extensions: 'Extensions',
        help: 'Help',
        lulumi: 'About Lulumi',
      },
    },
  },
  notification: {
    update: {
      updateAvailable: 'Newer version, %{releaseName}, has been found. Quit and install?',
    },
    permission: {
      request: {
        normal: '%{hostname} requests %{permission} permission.',
        setLanguage: '%{hostname} want to change language to %{lang} (restart is needed)',
        permanent: 'Remember this decision',
        allow: 'Allow',
        deny: 'Deny',
      },
    },
  },
  tab: {
    loading: 'Loading',
    findInPage: {
      placeholder: 'Search in Page',
      of: 'of',
      match: 'match | matches',
      status: '%{activeMatch} @:tab.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: 'loading',
    contextMenu: {
      newTab: 'New Tab',
      duplicateTab: 'Duplicate Tab',
      closeTab: 'Close Tab',
    },
  },
  lulumi: {
    aboutPage: {
      title: 'About Page',
    },
    downloadsPage: {
      title: 'Downloads',
    },
    lulumiPage: {
      title: 'About Lulumi',
    },
    preferencesPage: {
      searchEngineProviderPage: {
        title: 'Preferences / Search Engine Provider Page',
      },
      homePage: {
        title: 'Preferences / Homepage',
      },
      pdfViewerPage: {
        title: 'Preferences / PDFViewer',
      },
      tabConfigPage: {
        title: 'Preferences / Tab',
      },
      LanguagePage: {
        title: 'Preferences / Language',
      },
    },
    historyPage: {
      title: 'History',
    },
    extensionsPage: {
      title: 'Extensions',
    },
  },
};
