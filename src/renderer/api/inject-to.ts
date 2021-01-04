/* eslint-disable max-len */

import collect from 'collect.js';
import * as fs from 'fs';
import { ipcRenderer } from 'electron';
import { specs } from 'lulumi';
import * as path from 'path';
import * as url from 'url';
import { customAlphabet } from 'nanoid';
import { Store, get, set, del, keys } from 'idb-keyval';

import IpcEvent from './ipc-event';
import WebRequestEvent from './web-request-event';
import Event from './event';
import Port from './port';

const generateSuffix = customAlphabet('abcdefghijklmnopqrstuvwxyz', 32);

// Generate all possible signatures for a given API function.
function getSignatures(parameterSignatureString) {
  // First match everything inside the function argument parens.
  let args = parameterSignatureString.match(/.*?\(([^)]*)\)/)[1];

  // First match everything inside the function argument parens.
  args = args.split(',')
    // Ensure no inline comments are parsed and trim the whitespace.
    .map(arg => arg.replace(/\/\*.*\*\//, '').trim())
    // Ensure no undefined values are added.
    .filter(arg => arg);

  function dig(diggedArgs) {
    const results = [diggedArgs];
    diggedArgs.forEach((arg, index) => {
      if (arg.startsWith('optional')) {
        const tmp = JSON.parse(JSON.stringify(diggedArgs));
        tmp[index] = 'undefined';
        dig(tmp).forEach(r => results.push(r));
      }
      if (arg.startsWith('optional')) {
        const tmp = JSON.parse(JSON.stringify(diggedArgs));
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
    const { types, optional } = api.args[arg];
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

  const newArgs: any = Array.prototype.slice.call(args);
  const results = candidateSignatures.map((candidateSignature) => {
    if (newArgs.length === candidateSignature.length) {
      solved = true;
      candidateSignature.forEach((signature, index) => {
        let types;
        if (signature.split(' ')[0] === 'undefined') {
          types = 'undefined';
        } else if (signature.split(' ')[0] === 'optional') {
          types = signature.split(' ')[1].split('||');
        } else {
          types = signature.split(' ')[0].split('||');
        }
        if (!types.includes(typeof newArgs[index])) {
          solved = false;
        }
      });
      return solved;
    }
    return false;
  });
  return results.includes(true);
}

// Returns a string representing a call to an API function.
// Example return value for call: chrome.windows.get(1, callback) is:
// "windows.get(int, function)"
function getArgumentSignatureString(name, args) {
  const newArgs = Array.prototype.slice.call(args);
  const typeNames = newArgs.map(args2 => typeof args2);
  return `${name}(${typeNames.join(', ')})`;
}

// Finds the correct signature for the given arguments, then validates the
// arguments against that signature. Returns a 'normalized' arguments list
// where nulls are inserted where optional parameters were omitted.
// |args| is expected to be an array.
function normalizeArgumentsAndValidate(namespace, name, args) {
  const newArgs = Array.prototype.slice.call(args);
  if (!resolveSignature(namespace, name, newArgs)) {
    throw new Error(
      `Invocation of form ${namespace}.${getArgumentSignatureString(name, newArgs)} doesn't match definition ${namespace}.${getParameterSignatureString(namespace, name)}`
    );
  }
}

function wrapper(action: (results: any) => any | null, ...args: any) {
  const scope: string = args.shift();
  const suffix = generateSuffix();
  const count = ipcRenderer.sendSync('get-window-count');
  let counting = 0;
  const results: any = [];
  ipcRenderer.on(`${scope}-result-${suffix}`, (event, result) => {
    counting += 1;
    results.push(result);
    if (counting === count) {
      ipcRenderer.removeAllListeners(`${scope}-result-${suffix}`);
      if (action) {
        action(results);
      }
    }
  });
  ipcRenderer.send(scope, ...args, suffix);
}

let nextId = 0;
let nextPortId = 0;

const localStorage = new Store('local-store', 'local-storage');

ipcRenderer.setMaxListeners(0);
export default function injectTo(guestInstanceId: number, thisExtensionId: string, scriptType: string, context: Lulumi.Preload.Context) {
  context.lulumi = context.lulumi || {};
  const { lulumi } = context;

  const manifest = ipcRenderer.sendSync('get-manifest-map')[thisExtensionId];

  lulumi.env = {
    appName: (callback) => {
      wrapper(
        (results) => {
          if (callback) {
            // we only need one window to tell us the result
            callback(results[0]);
          }
        },
        'lulumi-env-app-name'
      );
    },
    appVersion: (callback) => {
      wrapper(
        (results) => {
          if (callback) {
            // we only need one window to tell us the result
            callback(results[0]);
          }
        },
        'lulumi-env-app-version'
      );
    },
  };

  lulumi.browserAction = {
    setIcon: (details, callback) => {
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-browser-action-set-icon',
        thisExtensionId,
        lulumi.runtime.getManifest().startPage,
        details,
      );
    },
    setBadgeText: (details) => {
      ipcRenderer.send(
        'lulumi-browser-action-set-badge-text',
        thisExtensionId,
        details,
      );
    },
    setBadgeBackgroundColor: (details) => {
      ipcRenderer.send(
        'lulumi-browser-action-set-badge-background-color',
        thisExtensionId,
        details,
      );
    },
    onClicked: (scriptType === 'event') ? new Event() : new IpcEvent('browser-action', 'on-clicked'),
  };

  lulumi.pageAction = {
    setIcon: (details, callback) => {
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-page-action-set-icon',
        thisExtensionId,
        lulumi.runtime.getManifest().startPage,
        details,
      );
    },
    show: (tabId) => {
      ipcRenderer.send('lulumi-page-action-show', tabId, thisExtensionId, true);
    },
    hide: (tabId) => {
      ipcRenderer.send('lulumi-page-action-hide', tabId, thisExtensionId, false);
    },
    onClicked: (scriptType === 'event') ? new Event() : new IpcEvent('page-action', 'on-clicked'),
  };

  lulumi.commands = {
    onCommand: (scriptType === 'event') ? new Event() : new IpcEvent('commands', 'on-command'),
  };

  lulumi.alarms = {
    get: (name, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).first());
          }
        },
        'lulumi-alarms-get',
        name
      );
    },
    getAll: (callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(results.all());
          }
        },
        'lulumi-alarms-get-all'
      );
    },
    clear: (name, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).every(result => (result !== undefined)));
          }
        },
        'lulumi-alarms-clear',
        name
      );
    },
    clearAll: (callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).every(result => (result !== undefined)));
          }
        },
        'lulumi-alarms-clear-all'
      );
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
    getURL: pathCrumb => url.format({
      protocol: 'lulumi-extension',
      slashes: true,
      hostname: thisExtensionId,
      pathname: pathCrumb,
    }),
    sendMessage: (extensionId, message, responseCallback) => {
      if (((typeof extensionId === 'string') || (typeof extensionId === 'object')) &&
        (typeof message === 'function') &&
        (responseCallback === undefined)) {
        // sendMessage(message, responseCallback)
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, message);
        return;
      }
      if (((typeof extensionId === 'string') || (typeof extensionId === 'object')) &&
        (message === undefined) &&
        (responseCallback === undefined)) {
        // sendMessage(message)
        lulumi.runtime.sendMessage(thisExtensionId, extensionId, null);
        return;
      }
      /*
      ipcRenderer.once('lulumi-runtime-send-message-result', (event, result) => {
        if (responseCallback) {
          responseCallback(result);
        }
      });
      */
      ipcRenderer.send('lulumi-runtime-send-message', extensionId, message, (extensionId !== thisExtensionId));
    },
    beforeConnect: (extensionId, connectInfo, responseScriptType, webContentsId) => {
      if (lulumi.runtime.port && responseScriptType && !lulumi.runtime.port.disconnected && scriptType !== 'event') {
        lulumi.runtime.port.updateResponseScriptType(responseScriptType);
      } else {
        nextPortId += 1;
        lulumi.runtime.port =
          new Port(nextPortId, extensionId, connectInfo, scriptType, responseScriptType, webContentsId);
        lulumi.tabs.query({ webContentsId: lulumi.runtime.port.webContentsId }, (tabs) => {
          lulumi.runtime.port.sender.setTab(tabs[0]);
        });
        lulumi.runtime.onConnect.emit(lulumi.runtime.port);
      }
    },
    connect: (extensionId, connectInfo = {}) => {
      let targetExtensionId = '';
      let newConnectInfo = connectInfo;
      if (scriptType !== 'event') {
        if (typeof extensionId === 'undefined') {
          // connect()
          targetExtensionId = thisExtensionId;
        } else if ((typeof extensionId === 'object') && (Object.keys(connectInfo).length === 0)) {
          // connect(connectInfo)
          newConnectInfo = extensionId;
          targetExtensionId = thisExtensionId;
        }
        nextPortId += 1;
        lulumi.runtime.port =
          new Port(nextPortId, targetExtensionId, newConnectInfo, scriptType, null, null);
      }
      return lulumi.runtime.port;
    },
    onMessage: (scriptType === 'event') ? new Event() : new IpcEvent('runtime', 'on-message'),
    onMessageExternal: (scriptType === 'event') ? new Event() : new IpcEvent('runtime', 'on-message-external'),
    onConnect: (scriptType === 'event') ? new Event() : 'Event scripts only',
  };

  lulumi.extension = {
    getURL: lulumi.runtime.getURL,
    getBackgroundPage: () => {
      if (scriptType === 'event') {
        return global;
      }
      // TODO: need to modify here to get the Window object of background page
      return global;
    },
  };

  lulumi.tabs = {
    get: (tabId, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).first());
          }
        },
        'lulumi-tabs-get',
        tabId
      );
    },
    getCurrent: (callback) => {
      if (guestInstanceId !== -1) {
        wrapper(
          (results) => {
            if (callback) {
              callback(collect(results).filter(result => ((result as any).id !== -1)).first());
            }
          },
          'lulumi-tabs-get-current',
          guestInstanceId
        );
      }
    },
    duplicate: (tabId, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).filter(result => ((result as any).id !== -1)).first());
          }
        },
        'lulumi-tabs-duplicate',
        tabId
      );
    },
    query: (queryInfo, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            const groups = collect(results).flatten(1).groupBy('windowId').all();
            Object.keys(groups).forEach(key => (groups[key] = groups[key].toArray()));
            // https://github.com/ecrmnn/collect.js#reduce
            callback(
              collect(Object.values(groups)).reduce(
                (a, b) => collect(a!).sortBy('index').all().concat((collect(b as any).sortBy('index').all() as any)), []
              )
            );
          }
        },
        'lulumi-tabs-query',
        queryInfo
      );
    },
    update: (tabId, updateProperties, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).filter(result => ((result as any).id !== -1)).first());
          }
        },
        'lulumi-tabs-update',
        tabId,
        updateProperties
      );
    },
    reload: (tabId, reloadProperties, callback) => {
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-tabs-reload',
        tabId,
        reloadProperties
      );
    },
    create: (createProperties, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).filter(result => ((result as any).id !== -1)).first());
          }
        },
        'lulumi-tabs-create',
        createProperties
      );
    },
    remove: (tabIds, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            callback(collect(results).flatten(1).sortBy('windowId').all());
          }
        },
        tabIds
      );
    },
    detectLanguage: (tabId, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            // we only need one window to tell us the result
            callback(results[0]);
          }
        },
        'lulumi-tabs-detect-language',
        tabId
      );
    },
    executeScript: (tabId, details: chrome.tabs.InjectDetails = {}, callback) => {
      if (details.file) {
        details.code = fs.readFileSync(path.join(manifest.srcDirectory, details.file), 'utf8');
      }
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-tabs-execute-script',
        tabId,
        details
      );
    },
    insertCSS: (tabId, details: chrome.tabs.InjectDetails = {}, callback) => {
      if (details.file) {
        details.code = fs.readFileSync(path.join(manifest.srcDirectory, details.file), 'utf8');
      }
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-tabs-insert-css',
        tabId,
        details
      );
    },
    sendMessage: (tabId, message, responseCallback) => {
      wrapper(
        (results) => {
          if (responseCallback) {
            // we only need one window to tell us the result
            responseCallback(results[0]);
          }
        },
        'lulumi-tabs-send-message',
        tabId,
        message
      );
    },
    onActivated: new IpcEvent('tabs', 'on-activated'),
    onUpdated: new IpcEvent('tabs', 'on-updated'),
    onCreated: new IpcEvent('tabs', 'on-created'),
    onRemoved: new IpcEvent('tabs', 'on-removed'),
  };

  lulumi.windows = {
    get: (windowId, getInfo, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            const window: any = collect(results).filter(result => (result !== undefined)).first();
            const windowTabs = window.tabs;
            if (windowTabs) {
              window.tabs = collect(windowTabs).sortBy('index').all();
            }
            callback(window);
          }
        },
        'lulumi-windows-get',
        windowId,
        getInfo
      );
    },
    getCurrent: (getInfo, callback) => {
      if (guestInstanceId !== -1) {
        wrapper(
          (results) => {
            if (callback) {
              const window: any = collect(results).filter(result => (result !== undefined)).first();
              const windowTabs = window.tabs;
              if (windowTabs) {
                window.tabs = collect(windowTabs).sortBy('index').all();
              }
              callback(window);
            }
          },
          'lulumi-windows-get-current',
          getInfo,
          guestInstanceId
        );
      }
    },
    getAll: (getInfo, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            results.forEach((window, index) => {
              const windowTabs = window.tabs;
              if (windowTabs) {
                results[index].tabs = collect(windowTabs).sortBy('index').all();
              }
            });
            callback(collect(results).sortBy('id').all());
          }
        },
        'lulumi-windows-get-all',
        getInfo
      );
    },
  };

  lulumi.storage = {
    set: (items, callback) => {
      Object.keys(items).forEach((key) => {
        get(key, localStorage).then((val: any) => {
          let oldValue = null;
          if (val !== undefined) {
            oldValue = JSON.parse(val);
          }
          const newValue = items[key];
          set(key, JSON.stringify(newValue), localStorage);
          lulumi.storage.onChanged.emit([{
            oldValue,
            newValue,
          }], 'local');
        });
      });

      if (callback) {
        callback();
      }
    },
    get: (_keys, callback) => {
      const ret = {};
      let ks;
      if (_keys !== null) {
        if (_keys.constructor === Object) {
          ks = [];
          Object.keys(_keys).forEach((key) => {
            ks.push(key);
            ret[key] = _keys[key];
          });
        } else if (_keys.constructor === String) {
          ks = [_keys];
        } else if (_keys.constructor === Array) {
          ks = _keys;
        }
        ks.forEach((key) => {
          get(key, localStorage).then((val: any) => {
            let tmp = null;
            if (val !== undefined) {
              tmp = JSON.parse(val);
            }
            ret[key] = (tmp !== null) ? tmp : ret[key];
          });
        });
      } else {
        keys(localStorage).then((_keys2) => {
          _keys2.forEach((key) => {
            get(key, localStorage).then((val: any) => {
              let tmp = null;
              if (val !== undefined) {
                tmp = JSON.parse(val);
              }
              ret[(key as any)] = tmp;
              if (ret[(key as any)] === null) {
                ret[(key as any)] = undefined;
              }
            });
          });
        });
      }

      if (callback) {
        callback(ret);
      }
    },
    remove: (_keys, callback) => {
      if (_keys !== null) {
        let ks;
        if (_keys.constructor === String) {
          ks = [_keys];
        } else if (_keys.constructor === Array) {
          ks = _keys;
        } else {
          return;
        }
        ks.forEach((key) => {
          del(key, localStorage);
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
                  ipcRenderer.removeAllListeners(menuItemIPC);
                });
                lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId].length = 0;
              }
            });
          }
        } else if (lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]) {
          Object.keys(lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id]).forEach((menuItemIPCId) => {
            lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId].forEach((menuItemIPC) => {
              ipcRenderer.removeAllListeners(menuItemIPC);
            });
            lulumi.contextMenus.menuItemsIPC[lulumi.runtime.id][menuItemIPCId].length = 0;
          });
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
        ipcRenderer.on(`lulumi-context-menus-clicked-${lulumi.runtime.id}-${menuItemId}`, (event, params, tabId, menuItem) => {
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
          lulumi.contextMenus.menuItems[lulumi.runtime.id].length = 0;
          lulumi.contextMenus.contextMenusIPC(null, null, null, true);
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
      lulumi.contextMenus.handleMenuItems(createProperties, null);
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-context-menus-create',
        lulumi.contextMenus.menuItems[lulumi.runtime.id]
      );
      return id;
    },
    remove: (menuItemId, callback) => {
      const id = menuItemId;
      lulumi.contextMenus.handleMenuItems(null, menuItemId);
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-context-menus-remove',
        lulumi.contextMenus.menuItems[lulumi.runtime.id]
      );
      return id;
    },
    removeAll: (callback) => {
      lulumi.contextMenus.handleMenuItems(null, null);
      wrapper(
        () => {
          if (callback) {
            callback();
          }
        },
        'lulumi-context-menus-remove-all',
        lulumi.contextMenus.menuItems[lulumi.runtime.id]
      );
    },
    onClicked: (scriptType === 'event') ? new Event() : 'Event scripts only',
  };

  lulumi.i18n = {
    getAcceptLanguages: (callback) => {
      if (callback) {
        callback(navigator.languages);
      }
    },
    // TODO: fix this
    getMessage: (messageName) => {
      if (typeof manifest.messages[messageName] === 'undefined') {
        return '';
      }
      return manifest.messages[messageName].message;
    },
    getUILanguage: () => navigator.language,
    detectLanguage: (text, callback) => {
      if (callback) {
        callback([]);
      }
    },
  };

  lulumi.webRequest = {
    onBeforeRequest: new WebRequestEvent(manifest.name, 'web-request', 'on-before-request'),
    onBeforeSendHeaders: new WebRequestEvent(manifest.name, 'web-request', 'on-before-send-headers'),
    onSendHeaders: new WebRequestEvent(manifest.name, 'web-request', 'on-send-headers'),
    onHeadersReceived: new WebRequestEvent(manifest.name, 'web-request', 'on-headers-received'),
    onResponseStarted: new WebRequestEvent(manifest.name, 'web-request', 'on-response-started'),
    onBeforeRedirect: new WebRequestEvent(manifest.name, 'web-request', 'on-before-redirect'),
    onCompleted: new WebRequestEvent(manifest.name, 'web-request', 'on-completed'),
    onErrorOccurred: new WebRequestEvent(manifest.name, 'web-request', 'on-error-occurred'),
  };

  lulumi.webNavigation = {
    getFrame: (details, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            // we only need one window to tell us the result
            callback(results[0]);
          }
        },
        'lulumi-web-navigation-get-frame',
        details
      );
    },
    getAllFrames: (details, callback) => {
      wrapper(
        (results) => {
          if (callback) {
            // we only need one window to tell us the result
            callback(results[0]);
          }
        },
        'lulumi-web-navigation-get-all-frames',
        details
      );
    },
    onBeforeNavigate: new IpcEvent('web-navigation', 'on-before-navigate'),
    onCommitted: new IpcEvent('web-navigation', 'on-committed'),
    onDOMContentLoaded: new IpcEvent('web-navigation', 'on-dom-content-loaded'),
    onCompleted: new IpcEvent('web-navigation', 'on-completed'),
    onCreatedNavigationTarget: new IpcEvent('web-navigation', 'on-created-navigation-target'),
  };

  // normalize arguments and validate
  const blackList = ['beforeConnect', 'handleMenuItems', 'contextMenusIPC'];
  Object.keys(lulumi).forEach((key) => {
    Object.keys(lulumi[key]).forEach((member) => {
      if (typeof lulumi[key][member] === 'function' && !blackList.includes(member)) {
        try {
          const cached = lulumi[key][member];
          lulumi[key][member] = (function proxy() {
            return function anonymous() {
              normalizeArgumentsAndValidate(key, member, arguments);
              return cached.apply(this, arguments);
            };
          }());
        } catch (event) {
          // eslint-disable-next-line no-console
          console.error(event);
        }
      }
    });
  });
}
