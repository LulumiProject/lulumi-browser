import fs from 'fs';

import Tab from './extensions/tab';

const tabArray = [];

// VueInstance is an instance of BrowserMainView
export default (VueInstance) => {
  const env = {
    appName: () => VueInstance.$electron.remote.app.getName(),
  };

  const tabs = {
    getCurrent: () => {
      const tab = new Tab(VueInstance.$store.getters.currentPageIndex);
      tabArray[tab.id] = tab;

      return tab;
    },
    query: (queryInfo) => {
      if (queryInfo.hasOwnProperty('active')) {
        return [new Tab(VueInstance.$store.getters.currentPageIndex)];
      }
    },
    update: (tabId, updateProperties = {}) => {
      const tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex)
        : tabArray[tabId];
      if (updateProperties.hasOwnProperty('url')) {
        VueInstance.getPage(tab.id).$refs.webview.loadURL(updateProperties.url);
      }
    },
    reload: (tabId, reloadProperties = { bypassCache: false }) => {
      const tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex)
        : tabArray[tabId];
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
    executeScript: (tabId, details = {}) => {
      const tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex)
        : tabArray[tabId];
      if (details.hasOwnProperty('file')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(
          String(fs.readFileSync(path.join(manifest.srcDirectory, details.file))),
          false);
      } else if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details = {}) => {
      const tab = (tabId === null)
        ? new Tab(VueInstance.$store.getters.currentPageIndex)
        : tabArray[tabId];
      if (details.hasOwnProperty('code')) {
        VueInstance.getPage(tab.id).$refs.webview.insertCSS(details.code);
      }
    },
    onUpdated: VueInstance.onUpdatedEvent,
    onCreated: VueInstance.onCreatedEvent,
    onRemoved: VueInstance.onRemovedEvent,
  };

  return {
    env,
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
