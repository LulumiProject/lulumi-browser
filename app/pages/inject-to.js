const { ipcRenderer, remote } = require('electron');
const path = require('path');
const url = require('url');

const Event = require('./extensions/event');

exports.injectTo = (extensionId, isBackgroundPage, context, LocalStorage) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
  let storagePath;
  let localStorage;

  if (LocalStorage) {
    storagePath = process.env.NODE_ENV === 'development'
      ? path.join(remote.app.getPath('temp'), 'lulumi-local-storage')
      : path.join(remote.app.getPath('userData'), 'lulumi-local-storage');

    // eslint-disable-next-line no-undef
    localStorage = new LocalStorage(storagePath);
  }

  lulumi.env = {
    appName: (callback) => {
      ipcRenderer.once('lulumi-env-app-name-result', (event, result) => {
        callback(result);
      });
      ipcRenderer.send('lulumi-env-app-name');
    },
  };

  lulumi.runtime = {
    id: extensionId,
    getURL: path => url.format({
      protocol: 'lulumi-extension',
      slashes: true,
      hostname: extensionId,
      pathname: path,
    }),
    onMessage: new Event('runtime', 'on-message'),
  };

  lulumi.tabs = {
    getCurrent: (callback) => {
      ipcRenderer.once('lulumi-tabs-get-current-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-tabs-get-current');
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
    onUpdated: new Event('tabs', 'on-updated'),
    onCreated: new Event('tabs', 'on-created'),
    onRemoved: new Event('tabs', 'on-removed'),
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
    onChanged: new Event('storage', 'on-changed'),
  };

  lulumi.storage.sync = {
    get: lulumi.storage.get,
    set: lulumi.storage.set,
  };
};
