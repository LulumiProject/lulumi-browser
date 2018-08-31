import { ipcRenderer } from 'electron';

import injectTo from '../renderer/api/inject-to';

/* tslint:disable:align */
/* tslint:disable:max-line-length */
/* tslint:disable:function-name */

const { LocalStorage } = require('node-localstorage');
const resizeSensor = require('css-element-queries/src/ResizeSensor.js');

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
  const context: Lulumi.Preload.Context = { lulumi: {} };
  globalObject.scriptType = 'popup';
  injectTo(guestInstanceId, extensionId, globalObject.scriptType, context, LocalStorage);
  globalObject.lulumi = context.lulumi;
  globalObject.chrome = globalObject.lulumi;

  globalObject.ipcRenderer = ipcRenderer;
  globalObject.ResizeSensor = resizeSensor;

  ipcRenderer.on('lulumi-runtime-before-connect', (event, extensionId, connectInfo, responseScriptType, webContentsId) => {
    globalObject.lulumi.runtime.beforeConnect(
      extensionId,
      connectInfo,
      responseScriptType,
      webContentsId);
  });
});
