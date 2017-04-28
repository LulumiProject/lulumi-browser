const { ipcRenderer, remote } = require('electron');
const path = require('path');
const url = require('url');

const IpcEvent = require('./extensions/ipc-event');
const Event = require('./extensions/event');

exports.injectTo = (extensionId, isBackgroundPage, context, LocalStorage) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
  let storagePath;
  let localStorage;

  if (LocalStorage) {
    storagePath = process.env.NODE_ENV === 'development'
      ? path.join(path.resolve('./userData'), 'lulumi-local-storage')
      : path.join(remote.app.getPath('userData'), 'lulumi-local-storage');

    // eslint-disable-next-line no-undef
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
      ipcRenderer.send('lulumi-page-action-show', tabId, extensionId, true);
    },
    hide: (tabId) => {
      ipcRenderer.send('lulumi-page-action-hide', tabId, extensionId, false);
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
    id: extensionId,
    getURL: path => url.format({
      protocol: 'lulumi-extension',
      slashes: true,
      hostname: extensionId,
      pathname: path,
    }),
    sendMessage: (extensionId, message, responseCallback) => {
      ipcRenderer.once('lulumi-runtime-send-message-result', (event, result) => {
        if (responseCallback) {
          responseCallback(result);
        }
      });
      if (extensionId === null) {
        ipcRenderer.send('lulumi-runtime-send-message', lulumi.runtime.id, message);
      } else {
        ipcRenderer.send('lulumi-runtime-send-message', extensionId, message);
      }
    },
    onMessage: (isBackgroundPage === false) ? new IpcEvent('runtime', 'on-message') : new Event(),
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
};
