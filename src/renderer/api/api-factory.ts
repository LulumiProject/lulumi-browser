import Event from './event';

import imageUtil from '../lib/image-util';

/* tslint:disable:max-line-length */

function findAndUpdateOrCreate(vueInstance: any, active: boolean, tabId: number, tabIndex?: number): Lulumi.Store.TabObject {
  const dummyTabObject: Lulumi.Store.TabObject = vueInstance.$store.getters.tabConfig.dummyTabObject;
  // if tabId === -1, we then just return a Tab instance with id = -1
  if (tabId === -1) {
    return dummyTabObject;
  }

  if (tabId === 0) {
    // if tabId === 0, then we just find the Tab having located at that tabIndex
    const tabObject: Lulumi.Store.TabObject = vueInstance.getTabObject(tabIndex);
    if (tabObject === undefined) {
      return dummyTabObject;
    }
    if (active) {
      vueInstance.onTabClick(tabIndex);
    }
    return tabObject;
  }

  // if we have tabId, then we just find one
  const tabObject: Lulumi.Store.TabObject = vueInstance.tabs.find(tab => (tab.id === tabId));
  if (tabObject === undefined) {
    return dummyTabObject;
  }
  if (active) {
    vueInstance.onTabClick(getBuiltInTabIndex(vueInstance, tabObject.index));
  }
  return tabObject;
}

function getBuiltInTabIndex(vueInstance: any, tabIndexThatWeSee: number): number {
  return vueInstance.tabs.findIndex(tab => tab.index === tabIndexThatWeSee);
}

// vueInstance is an instance of BrowserMainView
export default (vueInstance: any) => {
  const env = {
    appName: (): string => vueInstance.$electron.remote.app.getName(),
    appVersion: (): string => vueInstance.$electron.remote.app.getVersion(),
  };

  const browserAction = {
    setIcon: (extensionId: string, startPage: string, details: chrome.browserAction.TabIconDetails): void => {
      if (details.imageData) {
        let size = 16;
        if (typeof details.imageData === 'object') {
          if (details.imageData[16]) {
            details.imageData = details.imageData[16];
          } else if (details.imageData[32]) {
            size = 32;
            details.imageData = details.imageData[32];
          }
        }
        vueInstance.$refs.navbar.setBrowserActionIcon(extensionId, {
          type: 'path',
          url: imageUtil.getBase64FromImageData((details.imageData as ImageData), size),
          tabId: details.tabId,
        });
      } else if (details.path) {
        if (typeof details.path === 'object') {
          if (details.path[16]) {
            details.path = details.path[16];
          } else if (details.path[32]) {
            details.path = details.path[32];
          }
        }
        vueInstance.$refs.navbar.setBrowserActionIcon(extensionId, {
          type: 'path',
          url: `${startPage}/${details.path}`,
          tabId: details.tabId,
        });
      }
    },
    setBadgeText: (extensionId: string, details: chrome.browserAction.BadgeTextDetails): void => {
      if (details.text) {
        vueInstance.$refs.navbar.setBrowserActionBadgeText(extensionId, details);
      }
    },
    setBadgeBackgroundColor: (extensionId: string, details: chrome.browserAction.BadgeBackgroundColorDetails): void => {
      if (details.color) {
        if (typeof details.color === 'object') {
          const color: [number, number, number, number] = details.color;
          details.color = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
        }
        vueInstance.$refs.navbar.setBrowserActionBadgeBackgroundColor(extensionId, details);
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = tabs.query({ webContentsId })[0].index;
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onbrowserActionClickedEvent;
    },
  };

  const pageAction = {
    setIcon: (extensionId: string, startPage: string, details: chrome.pageAction.IconDetails): void => {
      if (details.imageData) {
        let size = 16;
        if (typeof details.imageData === 'object') {
          if (details.imageData[16]) {
            details.imageData = details.imageData[16];
          } else if (details.imageData[32]) {
            size = 32;
            details.imageData = details.imageData[32];
          }
        }
        vueInstance.$refs.navbar.setPageActionIcon(extensionId, {
          type: 'path',
          url: imageUtil.getBase64FromImageData((details.imageData as ImageData), size),
          tabId: details.tabId,
        });
      } else if (details.path) {
        if (typeof details.path === 'object') {
          if (details.path[16]) {
            details.path = details.path[16];
          } else if (details.path[32]) {
            details.path = details.path[32];
          }
        }
        vueInstance.$refs.navbar.setPageActionIcon(extensionId, {
          type: 'path',
          url: `${startPage}/${details.path}`,
          tabId: details.tabId,
        });
      }
    },
    onClicked: (webContentsId: number): Event => {
      let id = tabs.query({ webContentsId })[0].index;
      if (id === undefined) {
        id = 0;
      }
      return vueInstance.$refs.navbar.$data.onpageActionClickedEvent;
    },
  };

  const commands = {
    onCommand: vueInstance.onCommandEvent,
  };

  const runtime = {
    sendMessage: (extensionId: string, message: any, external: boolean, webContentsId: number): void => {
      let webContents: Electron.WebContents | null = null;
      const tabIndex: number = tabs.query({ webContentsId })[0].index;
      if (tabIndex === undefined) {
        // it's a popup.html or a background script
        webContents = vueInstance.$electron.remote.webContents.fromId(webContentsId);
      }
      const backgroundPages: Lulumi.API.BackgroundPages
        = vueInstance.$electron.ipcRenderer.sendSync('get-background-pages');
      const extension = backgroundPages[extensionId];
      if (extension) {
        vueInstance.$electron.remote.webContents.fromId(extension.webContentsId)
          .send('lulumi-runtime-send-message', external, message, (webContents ? { url: webContents.getURL() } : { tab: findAndUpdateOrCreate(vueInstance, false, 0, tabIndex) }));
      }
    },
    onMessage: (webContentsId: number): Event | undefined => {
      const tabIndex = tabs.query({ webContentsId })[0].index;
      if (tabIndex === undefined) {
        return undefined;
      }
      return vueInstance.getTab(tabIndex).onMessageEvent;
    },
    onMessageExternal: (webContentsId: number): Event | undefined => {
      const tabIndex = tabs.query({ webContentsId })[0].index;
      if (tabIndex === undefined) {
        return undefined;
      }
      // TODO: fix this
      return vueInstance.getTab(tabIndex).onMessageEvent;
    },
  };

  const tabs = {
    get: (tabId: number): Lulumi.Store.TabObject => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      return tab;
    },
    getCurrent: (guestInstanceId: number): Lulumi.Store.TabObject => {
      const webContents: Electron.WebContents = vueInstance.$electron.remote.getGuestWebContents(guestInstanceId);
      // https://github.com/electron/electron/blob/master/lib/browser/rpc-server.js#L133-L140
      if (!((webContents as any).type && (webContents as any).type === 'exception')) {
        const tabIndex = tabs.query({ webContentsId: webContents.id })[0].index;
        if (tabIndex === undefined) {
          return findAndUpdateOrCreate(vueInstance, false, -1);
        }
        const tab = findAndUpdateOrCreate(vueInstance, false, 0, tabIndex);
        return tab;
      }
      return findAndUpdateOrCreate(vueInstance, false, -1);
    },
    duplicate: (tabId: number): Lulumi.Store.TabObject => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        vueInstance.onTabDuplicate(tab.index);
        // TODO: timing issue
        return tabs.get(vueInstance.$store.getters.id);
      }
      return findAndUpdateOrCreate(vueInstance, false, -1);
    },
    query: (queryInfo: Lulumi.API.CustomTabsQueryInfo): Lulumi.Store.TabObject[] => {
      if (Object.keys(queryInfo).length === 0 || queryInfo.url === '<all_urls>') {
        return vueInstance.tabs;
      }

      const tabs: Lulumi.Store.TabObject[] = [];
      if (queryInfo.currentWindow) {
        delete queryInfo.currentWindow;
        queryInfo.windowId = vueInstance.windowId;
      }
      vueInstance.tabs.forEach((tab) => {
        if (Object.keys(queryInfo).every(k => (queryInfo[k] === tab[k]))) {
          tabs.push(tab);
        }
      });
      return tabs;
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties = {}): Lulumi.Store.TabObject => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        if (updateProperties.url) {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.loadURL(updateProperties.url);
        }
        if (updateProperties.active) {
          findAndUpdateOrCreate(vueInstance, true, tabId);
        }
        return tab;
      }
      return findAndUpdateOrCreate(vueInstance, false, -1);
    },
    reload: (tabId: number, reloadProperties: chrome.tabs.ReloadProperties = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        if (reloadProperties.bypassCache) {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.reloadIgnoringCache();
        } else {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.reload();
        }
      }
    },
    create: (createProperties: chrome.tabs.CreateProperties = {}): Lulumi.Store.TabObject => {
      if (createProperties.windowId === undefined) {
        createProperties.windowId = vueInstance.$electron.remote.BrowserWindow.getFocusedWindow().id;
      }
      if (createProperties.windowId && createProperties.windowId === vueInstance.windowId) {
        if (createProperties.url) {
          vueInstance.onNewTab(createProperties.windowId, createProperties.url, createProperties.active);
          // TODO: timing issue
          return tabs.get(vueInstance.$store.getters.id);
        }
      }
      return findAndUpdateOrCreate(vueInstance, false, -1);
    },
    remove: (tabIds: number[] | number): void => {
      const targetTabIds = Array.isArray(tabIds) ? tabIds : [tabIds];
      targetTabIds.forEach((tabId) => {
        const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
        if (tab.windowId === vueInstance.windowId) {
          vueInstance.onTabClose(getBuiltInTabIndex(vueInstance, tab.index));
        }
      });
    },
    detectLanguage: (tabId: number, suffix: string, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.executeJavaScript(`
          ipcRenderer.send('lulumi-tabs-detect-language-result', navigator.language, ${suffix}, ${webContentsId});
        `);
      }
    },
    executeScript: (tabId: number, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        if (details.code) {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.executeJavaScript(details.code);
        }
      }
    },
    insertCSS: (tabId, details: chrome.tabs.InjectDetails = {}): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        if (details.code) {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.insertCSS(details.code);
        }
      }
    },
    sendMessage: (tabId: number, message: any): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, tabId);
      if (tab.windowId === vueInstance.windowId) {
        vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.getWebContents().send('lulumi-tabs-send-message', message);
      }
    },
    onActivated: vueInstance.onActivatedEvent,
    onUpdated: vueInstance.onUpdatedEvent,
    onCreated: vueInstance.onCreatedEvent,
    onRemoved: vueInstance.onRemovedEvent,
  };

  const windows = {
    get: (windowId: number, getInfo: chrome.windows.GetInfo = {}): Lulumi.Store.LulumiBrowserWindowProperty | undefined => {
      if (windowId === vueInstance.windowId) {
        const window: Lulumi.Store.LulumiBrowserWindowProperty = Object.assign({}, vueInstance.window);
        if (getInfo.populate) {
          window.tabs = vueInstance.tabs;
        }
        return window;
      }
      return;
    },
    getCurrent: (getInfo: chrome.windows.GetInfo = {}, guestInstanceId: number): Lulumi.Store.LulumiBrowserWindowProperty | undefined => {
      const webContents: Electron.WebContents = vueInstance.$electron.remote.getGuestWebContents(guestInstanceId);
      // https://github.com/electron/electron/blob/master/lib/browser/rpc-server.js#L133-L140
      if (!((webContents as any).type && (webContents as any).type === 'exception')) {
        if (tabs.query({ webContentsId: webContents.id })[0].index === undefined) {
          return;
        }
        const window: Lulumi.Store.LulumiBrowserWindowProperty = Object.assign({}, vueInstance.window);
        if (getInfo.populate) {
          window.tabs = vueInstance.tabs;
        }
        return window;
      }
      return;
    },
    getAll: (getInfo: chrome.windows.GetInfo = {}): Lulumi.Store.LulumiBrowserWindowProperty => {
      const window: Lulumi.Store.LulumiBrowserWindowProperty = Object.assign({}, vueInstance.window);
      if (getInfo.populate) {
        window.tabs = vueInstance.tabs;
      }
      return window;
    },
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
    getFrame: (details: chrome.webNavigation.GetFrameDetails, suffix: string, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, details.tabId);
      if (tab.windowId === vueInstance.windowId) {
        const processId = vueInstance.getWebView(getBuiltInTabIndex(vueInstance, tab.index)).getWebContents().getOSProcessId();
        if (details.processId === processId) {
          vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.executeJavaScript(`
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
              ipcRenderer.send('lulumi-web-navigation-get-frame-result', frame, ${suffix}, ${webContentsId});
            }
          `);
        }
      }
    },
    getAllFrames: (details: chrome.webNavigation.GetAllFrameDetails, suffix: string, webContentsId: number): void => {
      const tab = findAndUpdateOrCreate(vueInstance, false, details.tabId);
      if (tab.windowId === vueInstance.windowId) {
        const processId = vueInstance.getWebView(getBuiltInTabIndex(vueInstance, tab.index)).getWebContents().getOSProcessId();
        vueInstance.getTab(getBuiltInTabIndex(vueInstance, tab.index)).$refs.webview.executeJavaScript(`
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
          ipcRenderer.send('lulumi-web-navigation-get-all-frames-result', framesArray, ${suffix}, ${webContentsId});
        `);
      }
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
    commands,
    runtime,
    tabs,
    windows,
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
