const { ipcRenderer, remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

process.once('loaded', () => {
  const extensionId = global.location.hostname;
  const context = {};
  require('../api/inject-to').injectTo(extensionId, 'popup', context, LocalStorage);
  global.lulumi = context.lulumi;
  global.chrome = global.lulumi;

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.on('lulumi-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    global.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId);
  });
});
