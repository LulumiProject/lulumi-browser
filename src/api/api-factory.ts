import Event from './extensions/event';
import { store } from 'lulumi';
import Tab from './extensions/tab';

/* tslint:disable:max-line-length */

const tabArray: Tab[] = [];

function findOrCreate(tabId: number, vueInstance: any) {
  let tab: Tab = (tabId === null)
    ? new Tab(vueInstance.$store.getters.currentPageIndex, true)
    : tabArray[tabId];
  if (tab === undefined) {
    tab = new Tab(tabId);

    const object: store.PageObject = vueInstance.getPageObject(tabId);
    if (object) {
      tab.update(object.location, object.title, object.favicon);
      tabArray[tab.id] = tab;
    }
  } else {
    tabArray.forEach((tab) => {
      tab.hightlight(tab.id === vueInstance.$store.getters.currentPageIndex);
    });
  }
  return tab;
}

// vueInstance is an instance of BrowserMainView
export default (vueInstance: any) => {
  const env = {
    appName: (): string => vueInstance.$electron.remote.app.getName(),
    appVersion: (): string => vueInstance.$electron.remote.app.getVersion(),
  };

  const browserAction = {
    setIcon: (extensionId: string, startPage: string, details: chrome.browserAction.TabIconDetails): void => {
      if (details.hasOwnProperty('path')) {
        vueInstance.$refs.navbar.setBrowserActionIcon(extensionId, `${startPage}/${details.path}`);
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = vueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onbrowserActionClickedEvent;
    },
  };

  const pageAction = {
    setIcon: (extensionId: string, startPage: string, details: chrome.pageAction.IconDetails): void => {
      if (details.hasOwnProperty('path')) {
        vueInstance.$refs.navbar.setPageActionIcon(extensionId, `${startPage}/${details.path}`);
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = vueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onpageActionClickedEvent;
    },
  };

  const runtime = {
    sendMessage: (extensionId: string, message: any, external: boolean, webContentsId: number): void => {
      let webContents: Electron.WebContents | null = null;
      const tabId = vueInstance.$store.getters.mappings[webContentsId];
      if (tabId === undefined) {
        // it's a popup.html or a background script
        webContents = vueInstance.$electron.remote.webContents.fromId(webContentsId);
      }
      const backgroundPages = vueInstance.$electron.remote.getGlobal('backgroundPages');
      const extension = backgroundPages[extensionId];
      vueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
        .send('lulumi-runtime-send-message', external, message, (webContents ? { url: webContents.getURL() } : { tab: findOrCreate(tabId, vueInstance) }));
    },
    onMessage: (webContentsId: number): Event | undefined => {
      let id = vueInstance.$store.getters.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }

      const page = vueInstance.getPage(id);
      if (page) {
        return vueInstance.getPage(id).onMessageEvent;
      }
      return undefined;
    },
  };

  const tabs = {
    get: (tabId: number): Tab => {
      const tab = findOrCreate(tabId, vueInstance);
      return tab;
    },
    getCurrent: (): Tab => {
      const tab = new Tab(vueInstance.$store.getters.currentPageIndex, true);
      tabArray[tab.id] = tab;

      const object = vueInstance.getPageObject(tab.id);
      tab.update(object.location, object.title, object.favicon);
      return tab;
    },
    duplicate: (tabId: number): Tab => {
      const tab = findOrCreate(tabId, vueInstance);
      vueInstance.onTabDuplicate(tab.id);

      const duplicateTab = new Tab(vueInstance.$store.getters.pages.length - 1, false);

      const object = vueInstance.getPageObject(duplicateTab.id);
      duplicateTab.update(object.location, object.title, object.favicon);
      tabArray[duplicateTab.id] = duplicateTab;
      return duplicateTab;
    },
    query: (queryInfo: chrome.tabs.QueryInfo): Tab[] => {
      if (queryInfo.hasOwnProperty('active')) {
        if (queryInfo.active) {
          const found = tabArray.findIndex(tab => tab.active);
          if (found !== -1) {
            return [tabArray[found]];
          }

          const tab = new Tab(vueInstance.$store.getters.currentPageIndex, true);
          tabArray[tab.id] = tab;

          const object = vueInstance.getPageObject(tab.id);
          tab.update(object.location, object.title, object.favicon);
          tabArray[tab.id] = tab;
          return [tab];
        }
      }
      const pages = vueInstance.$store.getters.pages;
      const tabs: Tab[] = [];
      let object;
      pages.forEach((page, index) => {
        tabs.push(new Tab(index, (index === vueInstance.$store.getters.currentPageIndex)));

        object = vueInstance.getPageObject(index);
        tabs[tabs.length - 1].update(object.location, object.title, object.favicon);
      });
      return tabs;
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties = {}): Tab => {
      const tab = findOrCreate(tabId, vueInstance);
      if (updateProperties.hasOwnProperty('url')) {
        vueInstance.getPage(tab.id).$refs.webview.loadURL(updateProperties.url);
      }
      if (updateProperties.hasOwnProperty('active')) {
        if (updateProperties.active) {
          vueInstance.onTabClick(tab.id);
        }
      }
      if (updateProperties.hasOwnProperty('highlighted')) {
        if (updateProperties.highlighted) {
          vueInstance.onTabClick(tab.id);
          tab.hightlight();
        }
      }

      const object = vueInstance.getPageObject(tabId);
      tab.update(object.location, object.title, object.favicon);
      return tab;
    },
    reload: (tabId: number, reloadProperties: chrome.tabs.ReloadProperties = { bypassCache: false }): void => {
      const tab = findOrCreate(tabId, vueInstance);
      if (reloadProperties.bypassCache) {
        vueInstance.getPage(tab.id).$refs.webview.reloadIgnoringCache();
      } else {
        vueInstance.getPage(tab.id).$refs.webview.reload();
      }
    },
    remove: (tabIds: number[] | number): void => {
      const targetTabIds = Array.isArray(tabIds) ? tabIds : [tabIds];
      targetTabIds.forEach(tabId => vueInstance.onTabClose(tabId));
    },
    detectLanguage: (tabId: number, webContentsId: number): void => {
      const tab = findOrCreate(tabId, vueInstance);
      vueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
        ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${webContentsId});
      `);
    },
    executeScript: (tabId: number, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findOrCreate(tabId, vueInstance);
      if (details.hasOwnProperty('code')) {
        vueInstance.getPage(tab.id).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findOrCreate(tabId, vueInstance);
      if (details.hasOwnProperty('code')) {
        vueInstance.getPage(tab.id).$refs.webview.insertCSS(details.code);
      }
    },
    sendMessage: (tabId: number, message: any): void => {
      const tab = findOrCreate(tabId, vueInstance);
      vueInstance.getPage(tab.id).$refs.webview.getWebContents().send('lulumi-tabs-send-message', message);
    },
    onActivated: vueInstance.onActivatedEvent,
    onUpdated: vueInstance.onUpdatedEvent,
    onCreated: vueInstance.onCreatedEvent,
    onRemoved: vueInstance.onRemovedEvent,
  };

  const storage = {
    onChanged: new Event(),
  };

  const contextMenus = {
    create: (menuItems, webContentsId: number): void => {
      menuItems.forEach((menuItem) => {
        menuItem.webContentsId = webContentsId;
        const submenu = menuItem.submenu;
        if (submenu) {
          submenu.forEach((sub) => {
            sub.webContentsId = webContentsId;
          });
        }
      });
      vueInstance.addContextMenus(menuItems, webContentsId);
    },
    remove: (menuItems, webContentsId: number): void => {
      menuItems.forEach((menuItem) => {
        menuItem.webContentsId = webContentsId;
        const submenu = menuItem.submenu;
        if (submenu) {
          submenu.forEach((sub) => {
            sub.webContentsId = webContentsId;
          });
        }
      });
      vueInstance.addContextMenus(menuItems, webContentsId);
    },
    removeAll: (menuItems, webContentsId: number): void => {
      vueInstance.addContextMenus([], webContentsId);
    },
  };

  const webNavigation = {
    getFrame: (details: chrome.webNavigation.GetFrameDetails, webContentsId: number): void => {
      const tab = findOrCreate(details.tabId, vueInstance);
      const processId = vueInstance.getWebView(tab.id).getWebContents().getOSProcessId();
      if (details.processId === processId) {
        vueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
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
    getAllFrames: (details: chrome.webNavigation.GetAllFrameDetails, webContentsId: number): void => {
      const tab = findOrCreate(details.tabId, vueInstance);
      const processId = vueInstance.getWebView(tab.id).getWebContents().getOSProcessId();
      vueInstance.getPage(tab.id).$refs.webview.executeJavaScript(`
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
    onBeforeNavigate: vueInstance.onBeforeNavigate,
    onCommitted: vueInstance.onCommitted,
    onDOMContentLoaded: vueInstance.onDOMContentLoaded,
    onCompleted: vueInstance.onCompleted,
    onCreatedNavigationTarget: vueInstance.onCreatedNavigationTarget,
  };

  return {
    env,
    browserAction,
    pageAction,
    runtime,
    tabs,
    storage,
    contextMenus,
    webNavigation,
  };
};

function isOverride(request: string, parent: any): boolean {
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

  return Promise.resolve(() => nodeModule._load = original);
}

export function initializeExtensionApi(apiFactory) {
  return defineAPI(apiFactory);
}
