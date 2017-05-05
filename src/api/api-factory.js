import fs from 'fs';

import Event from './extensions/event';
import Tab from './extensions/tab';

const tabArray = [];

function findOrCreate(tabId, VueInstance) {
  let tab = (tabId === null)
    ? new Tab(VueInstance.$store.getters.currentPageIndex, true)
    : tabArray[tabId];
  if (tab === undefined) {
    tab = new Tab(tabId);

    const object = VueInstance.getPageObject(tabId);
    if (object) {
      tab.update(object.location, object.title, object.favicon);
      tabArray[tab.id] = tab;
    }
  } else {
    tabArray.forEach((tab) => {
      tab.activate(tab.id === VueInstance.$store.getters.currentPageIndex);
    });
  }
  return tab;
}

// VueInstance is an instance of BrowserMainView
export default (VueInstance) => {
  const env = {
    appName: () => VueInstance.$electron.remote.app.getName(),
    appVersion: () => VueInstance.$electron.remote.app.getVersion(),
  };

  const browserAction = {
    onClicked: (webContentsId) => {
      let id = VueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return VueInstance.$refs.navbar.$data.onbrowserActionClickedEvent;
    },
  };

  const pageAction = {
    onClicked: (webContentsId) => {
      let id = VueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return VueInstance.$refs.navbar.$data.onpageActionClickedEvent;
    },
  };

  const runtime = {
    sendMessage: (extensionId, message, webContentsId) => {
      let tabId = VueInstance.$store.getters.mappings[webContentsId];
      if (tabId === undefined) {
        tabId = 0;
      }
      const tab = findOrCreate(tabId, VueInstance);
      const backgroundPages = VueInstance.$electron.remote.getGlobal('backgroundPages');
      const extension = backgroundPages[extensionId];
      VueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
        .send('lulumi-runtime-send-message', message, { tab });
    },
    onMessage: (webContentsId) => {
      let id = VueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }

      const page = VueInstance.getPage(id);
      if (page) {
        return VueInstance.getPage(id).onMessageEvent;
      }
      return undefined;
    },
  };

  const tabs = {
    get: (tabId) => {
      const tab = findOrCreate(tabId, VueInstance);
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
      const tab = findOrCreate(tabId, VueInstance);
      VueInstance.onTabDuplicate(tab.id);

      duplicateTab = new Tab(VueInstance.$store.getters.pages.length - 1, false);

      const object = VueInstance.getPageObject(duplicateTab.id);
      duplicateTab.update(object.location, object.title, object.favicon);
      tabArray[duplicateTab.id] = duplicateTab;
      return duplicateTab;
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
          tabArray[tab.id] = tab;
          return [tab];
        }
      }
      const pages = VueInstance.$store.getters.pages;
      const tabs = [];
      let object;
      pages.forEach((page, index) => {
        tabs.push(new Tab(index, (index === VueInstance.$store.getters.currentPageIndex)));

        object = VueInstance.getPageObject(index);
        tabs[tabs.length - 1].update(object.location, object.title, object.favicon);
      });
      return tabs;
    },
    update: (tabId, updateProperties = {}) => {
      const tab = findOrCreate(tabId, VueInstance);
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
      const tab = findOrCreate(tabId, VueInstance);
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
      const tab = findOrCreate(tabId, VueInstance);
      VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
        ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${webContentsId});
      `);
    },
    executeScript: (tabId, details = {}) => {
      const tab = findOrCreate(tabId, VueInstance);
      if (details.hasOwnProperty('file')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(
          String(fs.readFileSync(path.join(manifest.srcDirectory, details.file))),
          false);
      } else if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details = {}) => {
      const tab = findOrCreate(tabId, VueInstance);
      if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.insertCSS(details.code);
      }
    },
    sendMessage: (tabId, message) => {
      const tab = findOrCreate(tabId, VueInstance);
      VueInstance.getPage(tab.id).$refs.webview.getWebContents().send('lulumi-tabs-send-message', message);
    },
    onUpdated: VueInstance.onUpdatedEvent,
    onCreated: VueInstance.onCreatedEvent,
    onRemoved: VueInstance.onRemovedEvent,
  };

  const storage = {
    onChanged: new Event(),
  };

  const contextMenus = {
    create: (menuItems, webContentsId) => {
      menuItems.forEach((menuItem) => {
        menuItem.webContentsId = webContentsId;
        const submenu = menuItem.submenu;
        if (submenu) {
          submenu.forEach((sub) => {
            sub.webContentsId = webContentsId;
          });
        }
      });
      VueInstance.addContextMenus(menuItems, webContentsId);
    },
  };

  return {
    env,
    runtime,
    tabs,
    storage,
    contextMenus,
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
