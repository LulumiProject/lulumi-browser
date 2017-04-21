import fs from 'fs';

import Event from './extensions/event';
import Tab from './extensions/tab';

const tabArray = [];

// VueInstance is an instance of BrowserMainView
export default (VueInstance) => {
  const env = {
    appName: () => VueInstance.$electron.remote.app.getName(),
    appVersion: () => VueInstance.$electron.remote.app.getVersion(),
  };

  const runtime = {
    sendMessage: (extensionId, message, options) => {
      const backgroundPages = VueInstance.$electron.remote.getGlobal('sharedObject').backgroundPages;
      const extension = backgroundPages[extensionId];
      VueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
        .send('lulumi-runtime-send-message', message, options);
    },
    onMessage: (webContentsId) => {
      let id = VueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return VueInstance.getPage(id).onMessageEvent;
    },
  };

  const tabs = {
    get: (tabId) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      return tab;
    },
    getCurrent: () => {
      const tab = new Tab(VueInstance.$store.getters.currentPageIndex, true);
      tabArray[tab.id] = tab;

      const object = VueInstance.getPageObject(tab.id);
      tab.update(object.location, object.title, object.favicon);
      return tab;
    },
    duplicate: (tabId) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      VueInstance.onTabDuplicate(tab.id);

      tab = new Tab(VueInstance.$store.getters.pages.length - 1, false);

      const object = VueInstance.getPageObject(tab.id);
      tab.update(object.location, object.title, object.favicon);
      return tab;
    },
    query: (queryInfo) => {
      if (queryInfo.hasOwnProperty('active')) {
        if (queryInfo.active) {
          tabArray.forEach((tab) => {
            if (tab.active) {
              return tab;
            }
          });
          const tab = new Tab(VueInstance.$store.getters.currentPageIndex, true);
          tabArray[tab.id] = tab;

          const object = VueInstance.getPageObject(tab.id);
          tab.update(object.location, object.title, object.favicon);
          return [tab];
        }
      }
      const pages = VueInstance.$store.getters.pages;
      let tabs = [];
      let object;
      pages.forEach((page, index) => {
        tabs.push(new Tab(index, (index === VueInstance.$store.getters.currentPageIndex)));

        object = VueInstance.getPageObject(index);
        tabs[tabs.length - 1].update(object.location, object.title, object.favicon);
      });
      return tabs;
    },
    update: (tabId, updateProperties = {}) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId, false);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      if (updateProperties.hasOwnProperty('url')) {
        VueInstance.getPage(tab.id).$refs.webview.loadURL(updateProperties.url);
      }
      if (updateProperties.hasOwnProperty('active')) {
        if (updateProperties.active) {
          VueInstance.onTabClick(tab.id);
        }
      }
      if (updateProperties.hasOwnProperty('highlighted')) {
        if (updateProperties.highlighted) {
          VueInstance.onTabClick(tab.id);
          tab.activate();
        }
      }
      
      const object = VueInstance.getPageObject(tabId);
      tab.update(object.location, object.title, object.favicon);
      return tab;
    },
    reload: (tabId, reloadProperties = { bypassCache: false }) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      if (reloadProperties.bypassCache) {
        VueInstance.getPage(tab.id).$refs.webview.reloadIgnoringCache();
      } else {
        VueInstance.getPage(tab.id).$refs.webview.reload();
      }
    },
    remove: (tabIds) => {
      if (!Array.isArray(tabIds)) {
        tabIds = [tabIds];
      }
      tabIds.forEach(tabId => VueInstance.onTabClose(tabId));
    },
    detectLanguage: (tabId, webContentsId) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }

      VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
        ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${webContentsId});
      `);
    },
    executeScript: (tabId, details = {}) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      if (details.hasOwnProperty('file')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(
          String(fs.readFileSync(path.join(manifest.srcDirectory, details.file))),
          false);
      } else if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details = {}) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.insertCSS(details.code);
      }
    },
    sendMessage: (tabId, message) => {
      let tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
        : tabArray[tabId];
      if (tab === undefined) {
        tab = new Tab(tabId);

        const object = VueInstance.getPageObject(tabId);
        tab.update(object.location, object.title, object.favicon);
      } else {
        tabArray.forEach((tab) => {
          tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
        });
      }
      VueInstance.getPage(tab.id).$refs.webview.getWebContents().send('lulumi-tabs-send-message', message);
    },
    onUpdated: VueInstance.onUpdatedEvent,
    onCreated: VueInstance.onCreatedEvent,
    onRemoved: VueInstance.onRemovedEvent,
  };

  const storage = {
    onChanged: new Event(),
  };

  return {
    env,
    runtime,
    tabs,
    storage,
  };
};

function isOverride(request, parent) {
  return request === 'lulumi';
}

function defineAPI(apiFactory) {
  const nodeModule = require('module');
  const original = nodeModule._load;

  nodeModule._load = function load(request, parent) {
    if (isOverride(request, parent)) {
      return apiFactory;
    }

    return original.apply(this, arguments);
  };

  return Promise.resolve(() => Module._load = originalLoad);
}

export function initializeExtensionApi(apiFactory) {
  return defineAPI(apiFactory);
}
