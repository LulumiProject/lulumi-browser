/* eslint-disable max-len */

import { ipcRenderer } from 'electron';

import injectTo from '../renderer/api/inject-to';

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.includes('--guest-instance-id='));
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1
    ),
    10
  );
}

const globalObject = global as any;

process.once('loaded', () => {
  const { hostname } = globalObject.location; // hostname equals extensionId
  const context: any = {};
  globalObject.scriptType = 'event';
  injectTo(guestInstanceId, hostname, globalObject.scriptType, context);
  globalObject.lulumi = context.lulumi;
  globalObject.chrome = globalObject.lulumi;

  globalObject.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`lulumi-extension-${hostname}-going-removed`, () => {
    // remove all the registered things related to this extension
    Object.values(globalObject.lulumi.webRequest).forEach(v => (v as any).removeAllListeners());
    globalObject.lulumi.contextMenus.removeAll(() => {
      // removeBackgroundPages of src/main/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${hostname}-local-shortcut-unregister`);
      // removeBackgroundPages of src/main/api/listeners.ts
      ipcRenderer.send(`remove-lulumi-extension-${hostname}`);
      // removeBackgroundPages of src/main/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${hostname}-clean-done`);
    });
  });
  ipcRenderer.on('lulumi-runtime-send-message', (_, external, message, sender) => {
    if (external) {
      globalObject.lulumi.runtime.onMessageExternal.emit(message, sender);
    } else {
      globalObject.lulumi.runtime.onMessage.emit(message, sender);
    }
  });
  ipcRenderer.on('lulumi-runtime-before-connect', (_, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId
    );
  });
  ipcRenderer.on('lulumi-browser-action-clicked', (_, clickedTab) => {
    globalObject.lulumi.tabs.get(clickedTab.id, tab => globalObject.lulumi.browserAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-page-action-clicked', (_, clickedTab) => {
    globalObject.lulumi.tabs.get(clickedTab.id, tab => globalObject.lulumi.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-commands-triggered', (_, command) => {
    globalObject.lulumi.commands.onCommand.emit(command);
  });
});

process.once('exit', () => {
  globalObject.lulumi.runtime.port.disconnect();
});
