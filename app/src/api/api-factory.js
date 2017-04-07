import fs from 'fs';

import Tab from './extensions/tab';

const tabArray = [];

// VueInstance is an instance of BrowserMainView
export default (VueInstance) => {
  const env = {
    appName: () => Promise.resolve(VueInstance.$electron.remote.app.getName()),
  };

  const runtime = {
    getURL: () => {
      return Promise.resolve(VueInstance.getWebView().getURL());
    },
  };

  const tabs = {
    getCurrent: (callback) => {
      const tab = new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage());
      tabArray[tab.id] = tab;

      if (callback) {
        callback(tab);
      } else {
        return Promise.resolve(tab);
      }
    },
    query: (queryInfo, callback) => {
      if (queryInfo.hasOwnProperty('active')) {
        return Promise.resolve([new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage())]);
      }
    },
    update: (tabId, updateProperties = {}, callback) => {
      const tab = (tabId === undefined)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage())
        : tabArray[tabId];
      if (updateProperties.hasOwnProperty('url')) {
        tab.instance.$refs.webview.loadURL(updateProperties.url);
      }
    },
    reload: (tabId, reloadProperties = { bypassCache: false }, callback) => {
      const tab = (tabId === undefined)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage())
        : tabArray[tabId];
      if (reloadProperties.bypassCache) {
        tab.instance.$refs.webview.reloadIgnoringCache();
      } else {
        tab.instance.$refs.webview.reload();
      }
    },
    remove: (tabIds, callback) => {
      if (!Array.isArray(tabIds)) {
        tabIds = [tabIds];
      }
      tabIds.forEach(tabId => VueInstance.onTabClose(tabId));
    },
    executeScript: (tabId, details = {}, callback = null) => {
      const tab = (tabId === undefined)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage())
        : tabArray[tabId];
      if (details.hasOwnProperty('file')) {
        tab.instance.$refs.webview.executeJavaScript(
          String(fs.readFileSync(path.join(manifest.srcDirectory, details.file))),
          false, callback);
      } else if (details.hasOwnProperty('code')) {
        tab.instance.$refs.webview.executeJavaScript(details.code, false, callback);
      }
    },
    insertCSS: (tabId, details = {}, callback) => {
      const tab = (tabId === undefined)
        ? new Tab(VueInstance.$store.getters.currentPageIndex, VueInstance.getPage())
        : tabArray[tabId];
      if (details.hasOwnProperty('code')) {
        tab.instance.$refs.webview.insertCSS(details.code);
        if (callback) {
          callback();
        }
      }
    },
    onUpdated: VueInstance.onUpdatedEvent,
    onCreated: VueInstance.onCreatedEvent,
    onRemoved: VueInstance.onRemovedEvent,
  };

  return {
    env,
    runtime,
    tabs,
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
