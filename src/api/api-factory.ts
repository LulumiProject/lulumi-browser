import Event from './extensions/event';
import { store } from 'lulumi';
import Tab from './extensions/tab';

/* tslint:disable:max-line-length */

const tabArray: Tab[] = [];

function findAndUpdateOrCreate(vueInstance: any, tabId?: number, tabIndex?: number): Tab {
  let tab: Tab = new Tab(-1);
  if (typeof tabId !== 'undefined') {
    if (tabId === -1) {
      return tab;
    } else if (tabId === 0) {
      if (typeof tabIndex === 'undefined') {
        tab = new Tab(vueInstance.$store.getters.currentPageIndex, true);
        const object: store.PageObject = vueInstance.getPageObject(tab.index);
        tab.update(object.location, object.title, object.favicon);
        tabArray[tab.index] = tab;
      } else {
        tab = tabArray[tabIndex];
        if (tab === undefined) {
          tab = new Tab(tabIndex);
          const object: store.PageObject = vueInstance.getPageObject(tabIndex);
          tab.update(object.location, object.title, object.favicon);
          tabArray[tabIndex] = tab;
        } else {
          tabArray.map(tab => tab.hightlight(false));
          const tmpTab = tabArray[tabIndex];
          tmpTab.hightlight();
          const object: store.PageObject = vueInstance.getPageObject(tmpTab.index);
          tmpTab.update(object.location, object.title, object.favicon);
        }
      }
      return tab;
    } else {
      const index = tabArray.findIndex(tab => (tab.id === tabId));
      if (index === -1) {
        return tab;
      }
      return tabArray[index];
    }
  } else {
    tabArray.length = 0;
    vueInstance.$store.getters.pages.forEach((page, index) => {
      tabArray.push(new Tab(index, (index === vueInstance.$store.getters.currentPageIndex)));
      const object = vueInstance.getPageObject(index);
      tabArray[index].update(object.location, object.title, object.favicon);
    });
    return tab;
  }
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
    setBadgeText: (extensionId: string, details: chrome.browserAction.BadgeTextDetails): void => {
      if (details.hasOwnProperty('text')) {
        vueInstance.$refs.navbar.setBrowserActionBadgeText(extensionId, details);
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
      const tabIndex = vueInstance.$store.getters.mappings[webContentsId];
      if (tabIndex === undefined) {
        // it's a popup.html or a background script
        webContents = vueInstance.$electron.remote.webContents.fromId(webContentsId);
      }
      const backgroundPages = vueInstance.$electron.remote.getGlobal('backgroundPages');
      const extension = backgroundPages[extensionId];
      vueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
        .send('lulumi-runtime-send-message', external, message, (webContents ? { url: webContents.getURL() } : { tab: findAndUpdateOrCreate(vueInstance, 0, tabIndex) }));
    },
    onMessage: (webContentsId: number): Event | undefined => {
      const tabIndex = vueInstance.$store.getters.mappings[webContentsId];
      if (tabIndex === undefined) {
        return undefined;
      }
      return vueInstance.getPage(tabIndex).onMessageEvent;
    },
  };

  const tabs = {
    get: (tabId: number): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      return tab;
    },
    getCurrent: (): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, 0, vueInstance.$store.getters.currentPageIndex);
      return tab;
    },
    duplicate: (tabId: number): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      vueInstance.onTabDuplicate(tab.index);

      const duplicateTab = new Tab(vueInstance.$store.getters.pages.length - 1, false);

      const object = vueInstance.getPageObject(duplicateTab.index);
      duplicateTab.update(object.location, object.title, object.favicon);
      tabArray[duplicateTab.index] = duplicateTab;
      return duplicateTab;
    },
    query: (queryInfo: chrome.tabs.QueryInfo): Tab[] => {
      findAndUpdateOrCreate(vueInstance);
      if (Object.keys(queryInfo).length === 0) {
        return tabArray;
      } else {
        const tabs: Tab[] = [];
        tabArray.forEach((tab) => {
          if (Object.keys(queryInfo).every(k => (queryInfo[k] === tab[k]))) {
            tabs.push(tab);
          }
        });
        return tabs;
      }
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties = {}): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      if (updateProperties.hasOwnProperty('url')) {
        vueInstance.getPage(tab.index).$refs.webview.loadURL(updateProperties.url);
      }
      if (updateProperties.hasOwnProperty('active')) {
        if (updateProperties.active) {
          vueInstance.onTabClick(tab.index);
        }
      }
      if (updateProperties.hasOwnProperty('highlighted')) {
        if (updateProperties.highlighted) {
          vueInstance.onTabClick(tab.index);
          tab.hightlight();
        }
      }
      return tab;
    },
    reload: (tabId: number, reloadProperties: chrome.tabs.ReloadProperties = { bypassCache: false }): void => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      if (reloadProperties.bypassCache) {
        vueInstance.getPage(tab.index).$refs.webview.reloadIgnoringCache();
      } else {
        vueInstance.getPage(tab.index).$refs.webview.reload();
      }
    },
    remove: (tabIds: number[] | number): void => {
      const targetTabIds = Array.isArray(tabIds) ? tabIds : [tabIds];
      targetTabIds.forEach((tabId) => {
        const tab = findAndUpdateOrCreate(vueInstance, tabId);
        vueInstance.onTabClose(tab.index);
      });
    },
    detectLanguage: (tabId: number, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(`
        ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${webContentsId});
      `);
    },
    executeScript: (tabId: number, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      if (details.hasOwnProperty('code')) {
        vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      if (details.hasOwnProperty('code')) {
        vueInstance.getPage(tab.index).$refs.webview.insertCSS(details.code);
      }
    },
    sendMessage: (tabId: number, message: any): void => {
      const tab = findAndUpdateOrCreate(vueInstance, tabId);
      vueInstance.getPage(tab.index).$refs.webview.getWebContents().send('lulumi-tabs-send-message', message);
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
      const tab = findAndUpdateOrCreate(vueInstance, details.tabId);
      const processId = vueInstance.getWebView(tab.index).getWebContents().getOSProcessId();
      if (details.processId === processId) {
        vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(`
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
      const tab = findAndUpdateOrCreate(vueInstance, details.tabId);
      const processId = vueInstance.getWebView(tab.index).getWebContents().getOSProcessId();
      vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(`
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
