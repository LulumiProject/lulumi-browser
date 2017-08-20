import Event from './extensions/event';
import { api, store } from 'lulumi';
import Tab from './extensions/tab';

/* tslint:disable:max-line-length */

const tabArray: Tab[] = [];

function findAndUpdateOrCreate(vueInstance: any, active: boolean, tabId?: number, tabIndex?: number): Tab {
  let tabHolder: Tab = new Tab(0, -1, -1, false);
  if (tabId !== undefined) {
    // if tabId === -1, we then just return a Tab instance with id = -1
    if (tabId === -1) {
      return tabHolder;
    } else if (tabId === 0) {
      // if tabId === 0 and tabIndex remains undefined,
      // we then just create a Tab instance storing the information of current tab
      if (tabIndex === undefined) {
        tabHolder = new Tab(vueInstance.windowId, vueInstance.$store.getters.pid, vueInstance.currentPageIndex, active);
        const object: store.PageObject = vueInstance.getPageObject(tabHolder.index);
        tabHolder.update(object.location, object.title, object.favicon);
        tabArray[tabHolder.id] = tabHolder;
      } else {
        // however, if tabIndex has a value, then we find or create one
        const object: store.PageObject = vueInstance.getPageObject(tabIndex);
        if (object === undefined) {
          return tabHolder;
        }
        tabHolder = tabArray[object.pid];
        if (tabHolder === undefined) {
          tabHolder = new Tab(vueInstance.windowId, object.pid, tabIndex, active);
          tabHolder.update(object.location, object.title, object.favicon);
          tabArray[object.pid] = tabHolder;
        } else {
          tabArray[object.pid].update(object.location, object.title, object.favicon);
          tabHolder = tabArray[object.pid];
        }
      }
      if ((tabHolder.index !== -1) && active) {
        tabArray.map(tab => tab.activate(false));
        tabArray[tabHolder.id].activate(true);
        tabHolder = tabArray[tabHolder.id];
        vueInstance.onTabClick(tabHolder.index);
      }
      return tabArray[tabHolder.id];
    } else {
      // if we have tabId, then we just find or create one
      if (tabArray[tabId] === undefined) {
        const index = vueInstance.pages.findIndex(page => (page.pid === tabId));
        if (index === -1) {
          return tabHolder;
        }
        tabHolder = new Tab(vueInstance.windowId, tabId, index, active);
        const object: store.PageObject = vueInstance.getPageObject(tabHolder.index);
        tabHolder.update(object.location, object.title, object.favicon);
        tabArray[tabId] = tabHolder;
      }
      if (active) {
        tabArray.map(tab => tab.activate(false));
        tabArray[tabId].activate(true);
        vueInstance.onTabClick(tabArray[tabId].index);
      }
      return tabArray[tabId];
    }
  } else {
    setTimeout(() => {
      tabArray.length = 0;
      vueInstance.$store.getters.pages.forEach((page, index) => {
        findAndUpdateOrCreate(vueInstance, (index === vueInstance.currentPageIndex), 0, index);
        if (tabArray[page.pid]) {
          tabArray[page.pid].update(page.location, page.title, page.favicon);
        }
      });
      // tslint:disable-next-line:align
    }, 1000);
    return tabHolder;
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
      if (details.path) {
        vueInstance.$refs.navbar.setBrowserActionIcon(extensionId, `${startPage}/${details.path}`);
      }
    },
    setBadgeText: (extensionId: string, details: chrome.browserAction.BadgeTextDetails): void => {
      if (details.text) {
        vueInstance.$refs.navbar.setBrowserActionBadgeText(extensionId, details);
      }
    },
    setBadgeBackgroundColor: (extensionId: string, details: chrome.browserAction.BadgeBackgroundColorDetails): void => {
      if (details.color) {
        vueInstance.$refs.navbar.setBrowserActionBadgeBackgroundColor(extensionId, details);
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = vueInstance.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onbrowserActionClickedEvent;
    },
  };

  const pageAction = {
    setIcon: (extensionId: string, startPage: string, details: chrome.pageAction.IconDetails): void => {
      if (details.path) {
        vueInstance.$refs.navbar.setPageActionIcon(extensionId, `${startPage}/${details.path}`);
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = vueInstance.mappings[webContentsId];
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onpageActionClickedEvent;
    },
  };

  const runtime = {
    sendMessage: (extensionId: string, message: any, external: boolean, webContentsId: number): void => {
      let webContents: Electron.WebContents | null = null;
      const tabIndex: number = vueInstance.mappings[webContentsId];
      if (tabIndex === undefined) {
        // it's a popup.html or a background script
        webContents = vueInstance.$electron.remote.webContents.fromId(webContentsId);
      }
      const backgroundPages: api.BackgroundPages = vueInstance.$electron.remote.getGlobal('backgroundPages');
      const extension = backgroundPages[extensionId];
      if (extension) {
        vueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
          .send('lulumi-runtime-send-message', external, message, (webContents ? { url: webContents.getURL() } : { tab: findAndUpdateOrCreate(vueInstance, false, 0, tabIndex) }));
      }
    },
    onMessage: (webContentsId: number): Event | undefined => {
      const tabIndex = vueInstance.mappings[webContentsId];
      if (tabIndex === undefined) {
        return undefined;
      }
      return vueInstance.getPage(tabIndex).onMessageEvent;
    },
    onMessageExternal: (webContentsId: number): Event | undefined => {
      const tabIndex = vueInstance.mappings[webContentsId];
      if (tabIndex === undefined) {
        return undefined;
      }
      // TODO: fix this
      return vueInstance.getPage(tabIndex).onMessageEvent;
    },
  };

  const tabs = {
    get: (tabId: number): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      return tab;
    },
    getCurrent: (guestInstanceId: number): Tab => {
      const webContents: Electron.WebContents = vueInstance.$electron.remote.getGuestWebContents(guestInstanceId);
      if (webContents) {
        const tabIndex = vueInstance.mappings[webContents.id];
        if (tabIndex === undefined) {
          return findAndUpdateOrCreate(vueInstance, false, -1);
        }
        const tab = findAndUpdateOrCreate(vueInstance, false, 0, tabIndex);
        return tab;
      }
      return findAndUpdateOrCreate(vueInstance, false, -1);
    },
    duplicate: (tabId: number): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      vueInstance.onTabDuplicate(tab.index);

      const duplicateTab = findAndUpdateOrCreate(vueInstance, false, 0, vueInstance.$store.getters.pages.length - 1);

      const object = vueInstance.getPageObject(duplicateTab.index);
      duplicateTab.update(object.location, object.title, object.favicon);
      tabArray[duplicateTab.index] = duplicateTab;
      return duplicateTab;
    },
    query: (queryInfo: chrome.tabs.QueryInfo): Tab[] => {
      findAndUpdateOrCreate(vueInstance, false);
      if (Object.keys(queryInfo).length === 0) {
        return tabArray;
      } else {
        const tabs: Tab[] = [];
        if (queryInfo.currentWindow) {
          delete queryInfo.currentWindow;
          queryInfo.windowId = vueInstance.windowId;
        }
        tabArray.forEach((tab) => {
          if (Object.keys(queryInfo).every(k => (queryInfo[k] === tab[k]))) {
            tabs.push(tab);
          }
        });
        return tabs;
      }
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties): Tab => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (updateProperties.url) {
        vueInstance.getPage(tab.index).$refs.webview.loadURL(updateProperties.url);
      }
      if (updateProperties.active) {
        findAndUpdateOrCreate(vueInstance, true, tabId);
      }
      return tab;
    },
    reload: (tabId: number, reloadProperties: chrome.tabs.ReloadProperties): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (reloadProperties.bypassCache) {
        vueInstance.getPage(tab.index).$refs.webview.reloadIgnoringCache();
      } else {
        vueInstance.getPage(tab.index).$refs.webview.reload();
      }
    },
    create: (createProperties: chrome.tabs.CreateProperties): Tab => {
      let tab: Tab = findAndUpdateOrCreate(vueInstance, false, -1);
      if (createProperties.url) {
        vueInstance.onNewTab(createProperties.windowId, createProperties.url, createProperties.active);
      }
      tab = findAndUpdateOrCreate(vueInstance, true, 0, vueInstance.$store.getters.pages.length - 1);
      return tab;
    },
    remove: (tabIds: number[] | number): void => {
      const targetTabIds = Array.isArray(tabIds) ? tabIds : [tabIds];
      targetTabIds.forEach((tabId) => {
        const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
        vueInstance.onTabClose(tab.index);
      });
    },
    detectLanguage: (tabId: number, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(`
        ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${webContentsId});
      `);
    },
    executeScript: (tabId: number, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (details.code) {
        vueInstance.getPage(tab.index).$refs.webview.executeJavaScript(details.code, false);
      }
    },
    insertCSS: (tabId, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (details.code) {
        vueInstance.getPage(tab.index).$refs.webview.insertCSS(details.code);
      }
    },
    sendMessage: (tabId: number, message: any): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
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
      vueInstance.addContextMenus(menuItems, webContentsId);
    },
  };

  const webNavigation = {
    getFrame: (details: chrome.webNavigation.GetFrameDetails, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, details.tabId);
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
      const tab = findAndUpdateOrCreate(vueInstance, false, details.tabId);
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
