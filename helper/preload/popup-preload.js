const { ipcRenderer, remote, webFrame } = require('electron');
const { LocalStorage } = require('node-localstorage');
const ResizeSensor = require('css-element-queries/src/ResizeSensor');

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
  global.scriptType = 'popup';
  require('../api/inject-to').injectTo(guestInstanceId, extensionId, global.scriptType, context, LocalStorage);
  global.lulumi = context.lulumi;
  global.chrome = global.lulumi;

  global.ipcRenderer = ipcRenderer;
  global.ResizeSensor = ResizeSensor;

  ipcRenderer.on('lulumi-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    global.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId);
  });
});
