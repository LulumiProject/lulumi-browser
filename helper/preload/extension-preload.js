const { ipcRenderer, remote, webFrame } = require('electron');
const { LocalStorage } = require('node-localstorage');

webFrame.registerURLSchemeAsPrivileged('lulumi-extension');

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.indexOf('--guest-instance-id=') !== -1);
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1));
}

process.once('loaded', () => {
  const extensionId = global.location.hostname;
  const context = {};
  global.scriptType = 'event';
  require('../api/inject-to').injectTo(guestInstanceId, extensionId, global.scriptType, context, LocalStorage);
  global.lulumi = context.lulumi;
  global.chrome = global.lulumi;

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`lulumi-extension-${extensionId}-going-removed`, (event) => {
    // remove all the registered things related to this extension
    Object.values(global.lulumi.webRequest).forEach(v => v.removeAllListeners());
    global.lulumi.contextMenus.removeAll(() => {
      // removeBackgroundPages of src/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${extensionId}-local-shortcut-unregister`);
      // removeBackgroundPages of src/api/extensions/listeners.ts
      ipcRenderer.send(`remove-lulumi-extension-${extensionId}`);
      // removeBackgroundPages of src/api/lulumi-extension.ts
      ipcRenderer.send(`lulumi-extension-${extensionId}-clean-done`);
    });
  });
  ipcRenderer.on('lulumi-runtime-send-message', (event, external, message, sender) => {
    if (external) {
      global.lulumi.runtime.onMessageExternal.emit(message, sender);
    } else {
      global.lulumi.runtime.onMessage.emit(message, sender);
    }
  });
  ipcRenderer.on('lulumi-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    global.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId);
  });
  ipcRenderer.on('lulumi-browser-action-clicked', (event, tab) => {
    global.lulumi.tabs.get(tab.id, tab => global.lulumi.browserAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-page-action-clicked', (event, tab) => {
    global.lulumi.tabs.get(tab.id, tab => global.lulumi.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-commands-triggered', (event, command) => {
    global.lulumi.commands.onCommand.emit(command);
  });
});
