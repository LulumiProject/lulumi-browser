const { ipcRenderer, remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

process.once('loaded', () => {
  const extensionId = global.location.hostname;
  const context = {};
  require('../api/inject-to').injectTo(extensionId, 'event', context, LocalStorage);
  global.lulumi = context.lulumi;
  global.chrome = global.lulumi;

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.once(`lulumi-extension-${extensionId}-going-removed`, (event) => {
    // remove all the registered things related to this extension
    Object.values(global.lulumi.webRequest).forEach(v => v.removeAllListeners());
    global.lulumi.contextMenus.removeAll(() => {
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
