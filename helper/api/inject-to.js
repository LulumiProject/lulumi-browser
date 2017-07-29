const fs = require('fs');
const { ipcRenderer, remote } = require('electron');
const specs = require('lulumi').specs;
const path = require('path');
const url = require('url');

const IpcEvent = require('./extensions/ipc-event');
const webRequestEvent = require('./extensions/web-request-event');
const Event = require('./extensions/event');
const Port = require('./extensions/port');

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

// Generate all possible signatures for a given API function.
function getSignatures(ParameterSignatureString) {
  // First match everything inside the function argument parens.
  let args = ParameterSignatureString.match(/.*?\(([^)]*)\)/)[1];

  // First match everything inside the function argument parens.
  args = args.split(',')
    // Ensure no inline comments are parsed and trim the whitespace.
    .map(arg => arg.replace(/\/\*.*\*\//, '').trim())
    // Ensure no undefined values are added.
    .filter(arg => arg);

  function dig(args) {
    const results = [args];
    args.forEach((arg, index) => {
      if (arg.startsWith('optional')) {
        const tmp = JSON.parse(JSON.stringify(args));
        tmp[index] = "undefined";
        dig(tmp).forEach(r => results.push(r));
      }
      if (arg.startsWith('optional')) {
        const tmp = JSON.parse(JSON.stringify(args));
        tmp.splice(index, 1);
        dig(tmp).forEach(r => results.push(r));
      }
    });
    return results;
  }

  return dig(args);
}

// Returns a string representing the defined signature of the API function.
// Example return value for chrome.windows.getCurrent:
// "windows.getCurrent(optional object populate, function callback)"
function getParameterSignatureString(namespace, name) {
  const api = specs[namespace][name];
  const typeNames = Object.keys(api.args).map((arg) => {
    const types = api.args[arg].types;
    const optional = api.args[arg].optional;
    if (types.length > 1) {
      if (optional) {
        return `optional ${types.join('||')} ${arg}`;
      }
      return `${types.join('||')} ${arg}`;
    }
    if (optional) {
      return `optional ${types[0]} ${arg}`;
    }
    return `${types[0]} ${arg}`;
  });
  return `${name}(${typeNames.join(', ')})`;
}

// Validate arguments.
function resolveSignature(namespace, name, args) {
  const definedSignature = getParameterSignatureString(namespace, name);
  const candidateSignatures = getSignatures(definedSignature);
  let solved = false;

  args = Array.prototype.slice.call(args);
  const results = candidateSignatures.map((candidateSignature) => {
    if (args.length === candidateSignature.length) {
      solved = true;
      candidateSignature.forEach((signature, index) => {
        let types;
        if (signature.split(' ')[0] === 'undefined') {
          types = "undefined";
        } else if (signature.split(' ')[0] === 'optional') {
          types = signature.split(' ')[1].split('||');
        } else {
          types = signature.split(' ')[0].split('||');
        }
        if (types.indexOf(typeof args[index]) === -1) {
          solved = false;
        }
      });
      return solved;
    }
    return false;
  });
  return results.indexOf(true) !== -1;
}

// Returns a string representing a call to an API function.
// Example return value for call: chrome.windows.get(1, callback) is:
// "windows.get(int, function)"
function getArgumentSignatureString(name, args) {
  args = Array.prototype.slice.call(args);
  const typeNames = args.map(arg => typeof arg);
  return `${name}(${typeNames.join(', ')})`;
}

// Finds the correct signature for the given arguments, then validates the
// arguments against that signature. Returns a 'normalized' arguments list
// where nulls are inserted where optional parameters were omitted.
// |args| is expected to be an array.
function normalizeArgumentsAndValidate(namespace, name, args) {
  args = Array.prototype.slice.call(args);
  if (!resolveSignature(namespace, name, args)) {
    throw new Error(
      `Invocation of form ${namespace}.${getArgumentSignatureString(name, args)} doesn't match definition ${namespace}.${getParameterSignatureString(namespace, name)}`);
  }
}

let nextId = 0;

ipcRenderer.setMaxListeners(0);
exports.injectTo = (thisExtensionId, scriptType, context, LocalStorage) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
  let storagePath;
  let localStorage;

  const manifest = remote.getGlobal('manifestMap')[thisExtensionId];

  if (LocalStorage) {
    storagePath = process.env.NODE_ENV === 'development'
      ? path.join(path.resolve('./userData'), 'lulumi-local-storage')
      : path.join(remote.app.getPath('userData'), 'local-storage');

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
    setIcon: (details, callback) => {
      ipcRenderer.once('lulumi-browser-action-set-icon-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-browser-action-set-icon',
        thisExtensionId, lulumi.runtime.getManifest().startPage, details);
    },
    setBadgeText: (details) => {
      ipcRenderer.send('lulumi-browser-action-set-badge-text',
        thisExtensionId, details);
    },
    onClicked: (scriptType === 'event') ? new Event() : new IpcEvent('page-action', 'on-clicked'),
  };

  lulumi.pageAction = {
    setIcon: (details, callback) => {
      ipcRenderer.once('lulumi-page-action-set-icon-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-page-action-set-icon',
        thisExtensionId, lulumi.runtime.getManifest().startPage, details);
    },
    show: (tabId) => {
      ipcRenderer.send('lulumi-page-action-show', tabId, thisExtensionId, true);
    },
    hide: (tabId) => {
      ipcRenderer.send('lulumi-page-action-hide', tabId, thisExtensionId, false);
    },
    onClicked: (scriptType === 'event') ? new Event() : new IpcEvent('page-action', 'on-clicked'),
  };

  if ((scriptType === 'event')) {
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
    port: null,
    getManifest: () => manifest,
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
        // sendMessage(message, responseCallback)
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, message);
        return;
      } else if (((typeof extensionId === 'string') || (typeof extensionId === 'object'))
        && (message === undefined)) {
        // sendMessage(message)
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, () => {});
        return;
      }
      /*
      ipcRenderer.once('lulumi-runtime-send-message-result', (event, result) => {
        if (responseCallback) {
          responseCallback(result);
        }
      });
      */
      ipcRenderer.send('lulumi-runtime-send-message', extensionId, message, (extensionId !== thisExtensionId) /* whether it's an external message */);
    },
    beforeConnect: (extensionId, connectInfo, responseScriptType, webContentsId) => {
      if (lulumi.runtime.port && responseScriptType && !lulumi.runtime.port.disconnected && scriptType !== 'event') {
        lulumi.runtime.port.updateResponseScriptType(responseScriptType);
      } else {
        if (lulumi.runtime.port) {
          lulumi.runtime.port.disconnect();
        }
        lulumi.runtime.port = new Port(extensionId, connectInfo, scriptType, responseScriptType, webContentsId);
        lulumi.runtime.onConnect.emit(lulumi.runtime.port);
      }
    },
    connect: (extensionId, connectInfo = {}) => {
      if (scriptType !== 'event') {
        if (typeof extensionId === 'undefined') {
          // connect()
          extensionId = thisExtensionId;
        } else if ((typeof extensionId === 'object') && (Object.keys(connectInfo).length === 0)) {
          // connect(connectInfo)
          connectInfo = extensionId;
          extensionId = thisExtensionId;
        }
        lulumi.runtime.port = new Port(extensionId, connectInfo, scriptType, null, null);
      }
      return lulumi.runtime.port;
    },
    onMessage: (scriptType === 'event') ? new Event() : new IpcEvent('runtime', 'on-message') ,
    onMessageExternal: (scriptType === 'event') ? new Event() : new IpcEvent('runtime', 'on-message-external'),
    onConnect: (scriptType === 'event') ? new Event() : 'Event scripts only',
  };

  lulumi.extension = {
    getURL: lulumi.runtime.getURL,
    getBackgroundPage: () => {
      if (scriptType === 'event') {
        return global;
      } else {
        // TODO: need to modify here to get the Window object of background page
        return global;
      }
    },
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
      if (details.hasOwnProperty('file')) {
        details.code = fs.readFileSync(path.join(manifest.srcDirectory, details.file), 'utf8');
      }
      ipcRenderer.send('lulumi-tabs-execute-script', tabId, details);
    },
    insertCSS: (tabId, details = {}, callback) => {
      ipcRenderer.once('lulumi-tabs-insert-css-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      if (details.hasOwnProperty('file')) {
        details.code = fs.readFileSync(path.join(manifest.srcDirectory, details.file), 'utf8');
      }
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
    onActivated: new IpcEvent('tabs', 'on-activated'),
    onUpdated: new IpcEvent('tabs', 'on-updated'),
    onCreated: new IpcEvent('tabs', 'on-created'),
    onRemoved: new IpcEvent('tabs', 'on-removed'),
  };

  lulumi.storage = {
    set: (items, callback) => {
      Object.keys(items).forEach((key) => {
        const oldValue = JSON.parse(localStorage.getItem(key));
        const newValue = items[key];
        localStorage.setItem(key, JSON.stringify(newValue));

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
      const ret = {};
      let ks;
      if (keys !== null) {
        if (keys.constructor === Object) {
          ks = [];
          Object.keys(keys).forEach((key) => {
            ks.push(key);
            ret[key] = keys[key];
          });
        } else if (keys.constructor === String) {
          ks = [keys];
        } else if (keys.constructor === Array) {
          ks = keys;
        }
        ks.forEach((key) => {
            const tmp = JSON.parse(localStorage.getItem(key));
            ret[key] = (tmp !== null) ? tmp : ret[key];
        });
      } else {
        localStorage._keys.forEach((key) => {
            ret[key] = JSON.parse(localStorage.getItem(key));
            if (ret[key] === null) {
              ret[key] = undefined;
            }
        });
      }

      if (callback) {
        callback(ret);
      }
    },
    remove: (keys, callback) => {
      if (keys !== null) {
        let ks;
        if (keys.constructor === String) {
          ks = [keys];
        } else if (keys.constructor === Array) {
          ks = keys;
        } else {
          return;
        }
        ks.forEach((key) => {
          localStorage.removeItem(key);
        });

        if (callback) {
          callback();
        }
      }
    },
    onChanged: new IpcEvent('storage', 'on-changed'),
  };

  lulumi.storage.local = {
    get: lulumi.storage.get,
    set: lulumi.storage.set,
    remove: lulumi.storage.remove,
  };

  lulumi.storage.sync = {
    get: lulumi.storage.get,
    set: lulumi.storage.set,
    remove: lulumi.storage.remove,
  };

  lulumi.contextMenus = {
    menuItems: {},
    menuItemsIPC: {},
    contextMenusIPC: (parentMenuItemId, menuItemId, onclick, remove = false) => {
      if (remove) {
        if (menuItemId) {
          if (lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]) {
            Object.keys(lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]).forEach((menuItemIPCId) => {
              if (menuItemIPCId === menuItemId) {
                lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId].forEach((menuItemIPC) => {
                  ipcRenderer.removeAllListeners([ menuItemIPC ]);
                });
                lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId] = [];
              }
            });
          }
        } else {
          if (lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]) {
            Object.keys(lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]).forEach((menuItemIPCId) => {
              lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId].forEach((menuItemIPC) => {
                ipcRenderer.removeAllListeners([ menuItemIPC ]);
              });
              lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId] = [];
            });
          }
        }
      } else {
        if (!lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]) {
          lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id] = {};
        }
        if (parentMenuItemId) {
          if (lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][parentMenuItemId]) {
            lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][parentMenuItemId].push(`lulumi-context-menus-clicked-${lulumi.runtime.id}-${menuItemId}`);
          }
        } else {
          lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemId] = [`lulumi-context-menus-clicked-${lulumi.runtime.id}-${menuItemId}`];
        }
        ipcRenderer.on(`lulumi-context-menus-clicked-${lulumi.runtime.id}-${menuItemId}`, (event, params, tabId, menuItem, BrowserWindow) => {
          const info = {
            menuItemId,
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
          
          if (scriptType === 'event') {
            lulumi.tabs.get(tabId, tab => lulumi.contextMenus.onClicked.emit(info, tab));
          }
        });
      }
    },
    handleMenuItems: (createProperties, menuItemId) => {
      if ((createProperties === null) && (menuItemId === null)) {
        if (lulumi.contextMenus.menuItems[lulumi.runtime.id]) {
          lulumi.contextMenus.menuItems[lulumi.runtime.id] = [];
          lulumi.contextMenus.contextMenusIPC(null, null, true);
        }
      } else if (createProperties !== null) {
        let flag = true;
        if (!lulumi.contextMenus.menuItems[lulumi.runtime.id]) {
          lulumi.contextMenus.menuItems[lulumi.runtime.id] = [];
        }
        lulumi.contextMenus.menuItems[lulumi.runtime.id].forEach((menuItem) => {
          if (menuItem.id === createProperties.parentId) {
            menuItem.type = 'submenu';
            if (menuItem.submenu) {
              menuItem.submenu.push({
                label: createProperties.title,
                id: createProperties.id,
                type: createProperties.type,
                checked: createProperties.checked,
                extensionId: thisExtensionId,
              });
            } else {
              menuItem.submenu = [{
                label: createProperties.title,
                id: createProperties.id,
                type: createProperties.type,
                checked: createProperties.checked,
                extensionId: thisExtensionId,
              }];
            }
            if (createProperties.type !== 'separator' && createProperties.onclick) {
              lulumi.contextMenus.contextMenusIPC(createProperties.parentId, createProperties.id, createProperties.onclick);
            }
            flag = false;
          }
        });
        if (flag) {
          lulumi.contextMenus.menuItems[lulumi.runtime.id].push({
            label: createProperties.title,
            id: createProperties.id,
            type: createProperties.type,
            checked: createProperties.checked,
            extensionId: thisExtensionId,
          });
          if (createProperties.type !== 'separator' && createProperties.onclick) {
            lulumi.contextMenus.contextMenusIPC(null, createProperties.id, createProperties.onclick);
          }
        }
      } else if (menuItemId !== null) {
        if (lulumi.contextMenus.menuItems[lulumi.runtime.id]) {
          lulumi.contextMenus.menuItems[lulumi.runtime.id].forEach((menuItem, index) => {
            if (menuItem.id === menuItemId) {
              lulumi.contextMenus.menuItems[lulumi.runtime.id].splice(index, 1);
            }
          });
          lulumi.contextMenus.contextMenusIPC(null, menuItemId, null, true);
        }
      }
    },
    create: (createProperties, callback) => {
      nextId += 1;
      let id = `${lulumi.runtime.id}-${nextId}`;
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
      lulumi.contextMenus.handleMenuItems(createProperties, null);
      ipcRenderer.send('lulumi-context-menus-create', lulumi.contextMenus.menuItems[lulumi.runtime.id]);
      return id;
    },
    remove: (menuItemId, callback) => {
      const id = menuItemId;
      ipcRenderer.once('lulumi-context-menus-remove-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      lulumi.contextMenus.handleMenuItems(null, menuItemId);
      ipcRenderer.send('lulumi-context-menus-remove', lulumi.contextMenus.menuItems[lulumi.runtime.id]);
      return id;
    },
    removeAll: (callback) => {
      ipcRenderer.once('lulumi-context-menus-remove-all-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      lulumi.contextMenus.handleMenuItems(null, null);
      ipcRenderer.send('lulumi-context-menus-remove-all', lulumi.contextMenus.menuItems[lulumi.runtime.id]);
    },
    onClicked: (scriptType === 'event') ? new Event() : 'Event scripts only',
  };

  lulumi.i18n = {
    getAcceptLanguages: (callback) => {
      if (callback) {
        callback(navigator.languages);
      }
    },
    getMessage: (messageName, substitutions) => {
      return (typeof manifest.messages[messageName] === 'undefined')
        ? ""
        : manifest.messages[messageName].message;
    },
    getUILanguage: () => {
      return navigator.language;
    },
    detectLanguage: (text, callback) => {
      if (callback) {
        callback([]); // TODO: wait for electron 1.8.x
      }
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

  lulumi.webNavigation = {
    getFrame: (details, callback) => {
      ipcRenderer.once('lulumi-web-navigation-get-frame-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-web-navigation-get-frame', details);
    },
    getAllFrames: (details, callback) => {
      ipcRenderer.once('lulumi-web-navigation-get-all-frames-result', (event, result) => {
        if (callback) {
          callback(result);
        }
      });
      ipcRenderer.send('lulumi-web-navigation-get-all-frames', details);
    },
    onBeforeNavigate: new IpcEvent('web-navigation', 'on-before-navigate'),
    onCommitted: new IpcEvent('web-navigation', 'on-committed'),
    onDOMContentLoaded: new IpcEvent('web-navigation', 'on-dom-content-loaded'),
    onCompleted: new IpcEvent('web-navigation', 'on-completed'),
    onCreatedNavigationTarget: new IpcEvent('web-navigation', 'on-created-navigation-target'),
  };

  // wrapper
  const blackList = ['beforeConnect', 'handleMenuItems', 'contextMenusIPC'];
  Object.keys(lulumi).forEach((key) => {
    Object.keys(lulumi[key]).forEach((member) => {
      if (typeof lulumi[key][member] === 'function' && !blackList.includes(member)) {
        try {
          const cached = lulumi[key][member];
          lulumi[key][member] = (function () {
            return function () {
              normalizeArgumentsAndValidate(key, member, arguments);
              return cached.apply(this, arguments);
            };
          }());
        } catch (event) {}
      }
    });
  });
};
