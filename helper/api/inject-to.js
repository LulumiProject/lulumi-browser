const { ipcRenderer, remote } = require('electron');
const specs = require('lulumi').specs;
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
        if (signature.split(' ')[0] === 'optional') {
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

exports.injectTo = (thisExtensionId, isBackgroundPage, context, LocalStorage) => {
  context.lulumi = context.lulumi || {};
  const lulumi = context.lulumi;
  let storagePath;
  let localStorage;

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
    getBackgroundPage: () => global,
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
  Object.keys(lulumi).forEach((key) => {
    Object.keys(lulumi[key]).forEach((member) => {
      if (typeof lulumi[key][member] === 'function') {
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
