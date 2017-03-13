const { ipcRenderer, remote } = require('electron');

const requireTmp = require;
const moduleTmp = module;

process.once('loaded', () => {
  if (document.location.href.startsWith('lulumi://')) {
    ipcRenderer.send('lulumi-scheme-loaded', document.location.href);
    global.data = remote.getGlobal('sharedObject').guestData;

    global.require = requireTmp;
    global.module = moduleTmp;
    global.ipcRenderer = ipcRenderer;
  }
});
