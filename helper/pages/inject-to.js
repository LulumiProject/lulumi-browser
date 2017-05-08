const { ipcRenderer, remote } = require('electron');
const path = require('path');
const url = require('url');

const IpcEvent = require('./extensions/ipc-event');
const webRequestEvent = require('./extensions/web-request-event');
const Event = require('./extensions/event');

String.prototype.hashCode = function () {
  let hash = 0;
  let i;
  let chr;

  if (this.length === 0) {
    return hash;
  }
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // convert to 32bit integer
  }
  return hash;
};

exports.injectTo = (thisExtensionId, isBackgroundPage, context, LocalStorage) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
  let storagePath;
  let localStorage;

  if (LocalStorage) {
    storagePath = process.env.NODE_ENV === 'development'
      ? path.join(path.resolve('./userData'), 'lulumi-local-storage')
      : path.join(remote.app.getPath('userData'), 'lulumi-local-storage');

    localStorage = new LocalStorage(storagePath);
  }

  lulumi.env = {
    appName: (callback) => {
      ipcRenderer.once('lulumi-env-app-name-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-env-app-name');
    },
    appVersion: (callback) => {
      ipcRenderer.once('lulumi-env-app-version-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-env-app-version');
    },
  };

  lulumi.browserAction = {
    onClicked: (isBackgroundPage === false) ? new IpcEvent('page-action', 'on-clicked') : new Event(),
  };

  lulumi.pageAction = {
    show: (tabId) => {
      ipcRenderer.send('lulumi-page-action-show', tabId, thisExtensionId, true);
    },
    hide: (tabId) => {
      ipcRenderer.send('lulumi-page-action-hide', tabId, thisExtensionId, false);
    },
    onClicked: (isBackgroundPage === false) ? new IpcEvent('page-action', 'on-clicked') : new Event(),
  };

  if (isBackgroundPage) {
    lulumi.commands = {
      onCommand: new Event(),
    };
  }

  lulumi.alarms = {
    get: (name, callback) => {
      ipcRenderer.once('lulumi-alarms-get-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-alarms-get', name);
    },
    getAll: (callback) => {
      ipcRenderer.once('lulumi-alarms-get-all-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-alarms-get-all');
    },
    clear: (name, callback) => {
      ipcRenderer.once('lulumi-alarms-clear-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-alarms-clear', name);
    },
    clearAll: (callback) => {
      ipcRenderer.once('lulumi-alarms-clear-all-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-alarms-clear-all');
    },
    create: (name, alarmInfo) => {
      ipcRenderer.send('lulumi-alarms-create', name, alarmInfo);
    },
    onAlarm: new IpcEvent('alarms', 'on-alarm'),
  };

  lulumi.runtime = {
    id: thisExtensionId,
    getURL: path => url.format({
      protocol: 'lulumi-extension',
      slashes: true,
      hostname: thisExtensionId,
      pathname: path,
    }),
    sendMessage: (extensionId, message, responseCallback) => {
      if (((typeof extensionId === 'string') || (typeof extensionId === 'object'))
        && (typeof message === 'function')
        && (typeof responseCallback !== 'function')) {
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, message);
        return;
      } else if (((typeof extensionId === 'string') || (typeof extensionId === 'object'))
        && (message === undefined)) {
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, message);
        return;
      }
      // lulumi-runtime-send-message-result event will be set multiple times
      // if we have multiple lulumi.runtime.sendMessage, so ignore the listenters warning.
      ipcRenderer.setMaxListeners(0);
      ipcRenderer.once('lulumi-runtime-send-message-result', (event, result) => {
        if (responseCallback) {
          responseCallback(result);
        }
      });
      ipcRenderer.send('lulumi-runtime-send-message', thisExtensionId, message);
    },
    onMessage: (isBackgroundPage === false) ? new IpcEvent('runtime', 'on-message') : new Event(),
  };

  lulumi.extension = {
    getURL: lulumi.runtime.getURL,
  };

  lulumi.tabs = {
    get: (tabId, callback) => {
      ipcRenderer.once('lulumi-tabs-get-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-get', tabId);
    },
    getCurrent: (callback) => {
      ipcRenderer.once('lulumi-tabs-get-current-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-get-current');
    },
    duplicate: (tabId, callback) => {
      ipcRenderer.once('lulumi-tabs-duplicate-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-duplicate', tabId);
    },
    query: (queryInfo, callback) => {
      ipcRenderer.once('lulumi-tabs-query-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-query', queryInfo);
    },
    update: (tabId, updateProperties = {}, callback) => {
      ipcRenderer.once('lulumi-tabs-update-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-update', tabId, updateProperties);
    },
    reload: (tabId, reloadProperties = { bypassCache: false }, callback) => {
      ipcRenderer.once('lulumi-tabs-reload-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-reload', tabId, reloadProperties);
    },
    remove: (tabIds, callback) => {
      ipcRenderer.once('lulumi-tabs-remove-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-remove', tabIds);
    },
    detectLanguage: (tabId, callback) => {
      ipcRenderer.once('lulumi-tabs-detect-language-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-detect-language', tabId);
    },
    executeScript: (tabId, details = {}, callback) => {
      ipcRenderer.once('lulumi-tabs-execute-script-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-execute-script', tabId, details);
    },
    insertCSS: (tabId, details = {}, callback) => {
      ipcRenderer.once('lulumi-tabs-insert-css-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-insert-css', tabId, details);
    },
    sendMessage: (tabId, message, responseCallback) => {
      ipcRenderer.once('lulumi-tabs-send-message-result', (event, result) => {
        if (responseCallback) {
          responseCallback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-send-message', tabId, message);
    },
    onUpdated: new IpcEvent('tabs', 'on-updated'),
    onCreated: new IpcEvent('tabs', 'on-created'),
    onRemoved: new IpcEvent('tabs', 'on-removed'),
  };

  lulumi.storage = {
    set: (items, callback) => {
      Object.keys(items).forEach((item) => {
        const oldValue = localStorage.getItem(item);
        const newValue = items[item];
        localStorage.setItem(item, JSON.stringify(newValue));

        lulumi.storage.onChanged.emit([{
          oldValue,
          newValue,
        }], 'local');
      });

      if (callback) {
        callback();
      }
    },
    get: (keys, callback) => {
      let ks;
      if (keys.constructor === Object) {
        ks = keys;
      } else if (keys.constructor === String) {
        ks = [keys];
      } else if (keys.constructor === Array) {
        ks = keys;
      }

      const ret = {};
      Object.keys(ks).forEach((key) => {
        const tkey = ks[key];
        ret[tkey] = JSON.parse(localStorage.getItem(tkey));
        if (ret[tkey] === null) {
          ret[tkey] = undefined;
        }
      });

      if (callback) {
        callback(ret);
      }
    },
    onChanged: new IpcEvent('storage', 'on-changed'),
  };

  lulumi.storage.local = {
    get: lulumi.storage.get,
    set: lulumi.storage.set,
  };

  lulumi.storage.sync = {
    get: lulumi.storage.get,
    set: lulumi.storage.set,
  };

  lulumi.contextMenus = {
    menuItems: [],
    menuItemsIPC: [],
    contextMenusIPC: (id, onclick, digest) => {
      lulumi.contextMenus.menuItemsIPC.push(`lulumi-context-menus-clicked-${lulumi.runtime.id}-${id}-${digest}`);
      ipcRenderer.on(`lulumi-context-menus-clicked-${lulumi.runtime.id}-${id}-${digest}`, (event, params, tabId, menuItem, BrowserWindow) => {
        const info = {
          menuItemId: id,
          mediaType: params.mediaType,
          linkUrl: params.linkURL,
          srcUrl: params.srcURL,
          pageUrl: params.pageURL,
          frameUrl: params.frameURL,
          selectionText: params.selectionText,
          editable: params.isEditable,
          checked: menuItem.checked,
        };
        lulumi.tabs.get(tabId, tab => onclick(info, tab));
      });
    },
    handleMenuItems: (createProperties) => {
      let digest;
      if (createProperties.type !== 'separator') {
        digest = createProperties.onclick.toString().hashCode();
      }
      let flag = true;
      lulumi.contextMenus.menuItems.forEach((menuItem) => {
        if (menuItem.id === createProperties.parentId) {
          menuItem.type = 'submenu';
          if (menuItem.submenu) {
            menuItem.submenu.push({
              label: createProperties.title,
              id: createProperties.id,
              type: createProperties.type,
              checked: createProperties.checked,
              digest,
              extensionId: thisExtensionId,
            });
          } else {
            menuItem.submenu = [{
              label: createProperties.title,
              id: createProperties.id,
              type: createProperties.type,
              checked: createProperties.checked,
              digest,
              extensionId: thisExtensionId,
            }];
          }
          if (createProperties.type !== 'separator' && createProperties.onclick) {
            lulumi.contextMenus.contextMenusIPC(createProperties.id, createProperties.onclick, digest);
          }
          flag = false;
        }
      });
      if (flag) {
        lulumi.contextMenus.menuItems.push({
          label: createProperties.title,
          id: createProperties.id,
          type: createProperties.type,
          checked: createProperties.checked,
          digest,
          extensionId: thisExtensionId,
        });
        if (createProperties.type !== 'separator' && createProperties.onclick) {
          lulumi.contextMenus.contextMenusIPC(createProperties.id, createProperties.onclick, digest);
        }
      }
    },
    create: (createProperties, callback) => {
      let id = `${lulumi.runtime.id}-${Date.now()}`;
      if (createProperties.id) {
        id = createProperties.id;
      } else {
        createProperties.id = id;
      }
      ipcRenderer.once('lulumi-context-menus-create-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      lulumi.contextMenus.handleMenuItems(createProperties);
      ipcRenderer.send('lulumi-context-menus-create', lulumi.contextMenus.menuItems);
      return id;
    },
  };

  lulumi.webRequest = {
    onBeforeRequest: new webRequestEvent('web-request', 'on-before-request'),
    onBeforeSendHeaders: new webRequestEvent('web-request', 'on-before-send-headers'),
    onSendHeaders: new webRequestEvent('web-request', 'on-send-headers'),
    onHeadersReceived: new webRequestEvent('web-request', 'on-headers-received'),
    onResponseStarted: new webRequestEvent('web-request', 'on-response-started'),
    onBeforeRedirect: new webRequestEvent('web-request', 'on-before-redirect'),
    onCompleted: new webRequestEvent('web-request', 'on-completed'),
    onErrorOccurred: new webRequestEvent('web-request', 'on-error-occurred'),
  };
};
