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
  downloads: {
    state: {
      progressing: 'progressing',
      cancelled: 'cancelled',
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
        info: '%{hostname} requests %{permission} permission.',
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
