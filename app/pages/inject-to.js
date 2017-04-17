const { ipcRenderer } = require('electron');
const url = require('url');

exports.injectTo = (extensionId, isBackgroundPage, context) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
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
  };
};
