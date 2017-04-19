const { ipcRenderer, remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

process.once('loaded', () => {
  const inject = (extensionId) => {
    const context = {};
    require('./inject-to').injectTo(extensionId, true, context, LocalStorage);
    global.lulumi = context.lulumi;
  };

  // read the renderer process preferences to see if we need to inject scripts
  const preferences = remote.getGlobal('renderProcessPreferences');
  if (preferences) {
    preferences.forEach(pref => inject(pref.extensionId));
  }

  ipcRenderer.on('lulumi-runtime-send-message', (event, message, options) => {
    global.lulumi.runtime.onMessage.emit(message, options);
  });
});
