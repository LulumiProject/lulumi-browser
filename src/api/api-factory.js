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
      tab.hightlight(tab.id === VueInstance.$store.getters.currentPageIndex);
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
          tab.hightlight();
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
    onActivated: VueInstance.onActivatedEvent,
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

  const webNavigation = {
    getFrame: (details, webContentsId) => {
      const tab = findOrCreate(details.tabId, VueInstance);
      const processId = VueInstance.getWebView(tab.id).getWebContents().getOSProcessId();
      if (details.processId === processId) {
        VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
          String.prototype.hashCode = function() {
            var hash = 0, i, chr;
            if (this.length === 0) return hash;
            for (i = 0; i < this.length; i++) {
              chr   = this.charCodeAt(i);
              hash  = ((hash << 5) - hash) + chr;
              hash |= 0; // Convert to 32bit integer
            }
            return hash;
          };

          var frame = null;
          var frames = window.frames;
          var flag = true;

          for (i = 0; i < frames.length; i++) {
            if (frames[i].location.href.hashCode() === '${details.frameId}') {
              frame = {
                errorOccurred: false,
                processId: ${processId},
                frameId: frames[i].location.href.hashCode(),
                parentFrameId: 0,
                url: frames[i].location.href,
              };
              flag = false;
              ipcRenderer.send('lulumi-web-navigation-get-frame-result', frame, ${webContentsId});
              break;
            }
          }
          if (flag) {
            if (${details.frameId} === 0) {
              frame = {
                errorOccurred: false,
                processId: ${processId},
                frameId: 0,
                parentFrameId: -1,
                url: document.location.href,
              };
            }
            ipcRenderer.send('lulumi-web-navigation-get-frame-result', frame, ${webContentsId});
          }
        `);
      }
    },
    getAllFrames: (details, webContentsId) => {
      const tab = findOrCreate(details.tabId, VueInstance);
      const processId = VueInstance.getWebView(tab.id).getWebContents().getOSProcessId();
      VueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
        String.prototype.hashCode = function() {
          var hash = 0, i, chr;
          if (this.length === 0) return hash;
          for (i = 0; i < this.length; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
          }
          return hash;
        };

        var framesArray = [];
        var frames = window.frames;

        for (i = 0; i < frames.length; i++) {
          framesArray.push({
            errorOccurred: false,
            processId: ${processId},
            frameId: frames[i].location.href.hashCode(),
            parentFrameId: 0,
            url: frames[i].location.href,
          });
        }
        framesArray.unshift({
          errorOccurred: false,
          processId: ${processId},
          frameId: 0,
          parentFrameId: -1,
          url: document.location.href,
        });
        ipcRenderer.send('lulumi-web-navigation-get-all-frames-result', framesArray, ${webContentsId});
      `);
    },
    onBeforeNavigate: VueInstance.onBeforeNavigate,
    onCommitted: VueInstance.onCommitted,
    onDOMContentLoaded: VueInstance.onDOMContentLoaded,
    onCompleted: VueInstance.onCompleted,
    onCreatedNavigationTarget: VueInstance.onCreatedNavigationTarget,
  };

  return {
    env,
    runtime,
    tabs,
    storage,
    contextMenus,
    webNavigation,
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
