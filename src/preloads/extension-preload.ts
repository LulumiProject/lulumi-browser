import { ipcRenderer } from 'electron';

import injectTo from '../renderer/api/inject-to';

/* tslint:disable:align */
/* tslint:disable:max-line-length */
/* tslint:disable:function-name */

const { LocalStorage } = require('node-localstorage');

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.indexOf('--guest-instance-id=') !== -1);
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1), 10);
}

const globalObject = global as any;

process.once('loaded', () => {
  const extensionId = globalObject.location.hostname;
  const context: any = {};
  globalObject.scriptType = 'event';
  injectTo(guestInstanceId, extensionId, globalObject.scriptType, context, LocalStorage);
  globalObject.lulumi = context.lulumi;
  globalObject.chrome = globalObject.lulumi;

  globalObject.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`lulumi-extension-${extensionId}-going-removed`, (event) => {
    // remove all the registered things related to this extension
    Object.values(globalObject.lulumi.webRequest).forEach(v => (v as any).removeAllListeners());
    globalObject.lulumi.contextMenus.removeAll(() => {
      // removeBackgroundPages of src/main/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${extensionId}-local-shortcut-unregister`);
      // removeBackgroundPages of src/main/api/listeners.ts
      ipcRenderer.send(`remove-lulumi-extension-${extensionId}`);
      // removeBackgroundPages of src/main/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${extensionId}-clean-done`);
    });
  });
  ipcRenderer.on('lulumi-runtime-send-message', (event, external, message, sender) => {
    if (external) {
      globalObject.lulumi.runtime.onMessageExternal.emit(message, sender);
    } else {
      globalObject.lulumi.runtime.onMessage.emit(message, sender);
    }
  });
  ipcRenderer.on('lulumi-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId);
  });
  ipcRenderer.on('lulumi-browser-action-clicked', (event, tab) => {
    globalObject.lulumi.tabs.get(tab.id, tab => globalObject.lulumi.browserAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-page-action-clicked', (event, tab) => {
    globalObject.lulumi.tabs.get(tab.id, tab => globalObject.lulumi.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-commands-triggered', (event, command) => {
    globalObject.lulumi.commands.onCommand.emit(command);
  });
});

process.once('exit', () => {
  globalObject.lulumi.runtime.port.disconnect();
});
