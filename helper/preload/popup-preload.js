const { ipcRenderer, remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

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
  require('../api/inject-to').injectTo(guestInstanceId, extensionId, 'popup', context, LocalStorage);
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
