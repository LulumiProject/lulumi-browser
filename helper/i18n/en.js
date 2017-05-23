export const guest = {
  about: {
    aboutPage: 'About Page',
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
        title: 'Search Engine Provider Page',
        current: 'Current',
        searchEngine: 'Search Engine',
        name: 'Name',
      },
      homePage: {
        title: 'Homepage',
        homepage: 'homepage',
      },
      pdfViewerPage: {
        title: 'PDFViewer',
      },
      tabConfigPage: {
        title: 'Tab',
        location: 'Opening Location',
        favicon: 'Default Favicon',
      },
      LanguagePage: {
        title: 'Language',
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
      insecure: 'Normal',
    },
    cascader: {
      options: {
        preferences: 'Preferences',
        downloads: 'Downloads',
        history: 'History',
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
        allow: 'Allow',
        deny: 'Deny',
      },
    },
  },
  page: {
    loading: 'Loading',
    findInPage: {
      placeholder: 'Search in Page',
      of: 'of',
      match: 'match | matches',
      status: '%{activeMatch} @:page.findInPage.of %{matches}',
    },
  },
  tabs: {
    loading: 'loading',
  },
};
