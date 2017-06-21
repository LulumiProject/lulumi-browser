const { ipcRenderer, remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

process.once('loaded', () => {
  const inject = (extensionId) => {
    const context = {};
    require('../api/inject-to').injectTo(extensionId, true, context, LocalStorage);
    global.lulumi = context.lulumi;
    global.chrome = global.lulumi;
  };

  // read the renderer process preferences to see if we need to inject scripts
  const preferences = remote.getGlobal('renderProcessPreferences');
  if (preferences) {
    preferences.forEach(pref => inject(pref.extensionId));
  }

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.on('lulumi-runtime-send-message', (event, external, message, sender) => {
    if (external) {
      global.lulumi.runtime.onMessageExternal.emit(message, sender);
    } else {
      global.lulumi.runtime.onMessage.emit(message, sender);
    }
  });
  ipcRenderer.on('lulumi-page-action-clicked', (event, tab) => {
    global.lulumi.tabs.get(tab.id, tab => global.lulumi.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-commands-triggered', (event, command) => {
    global.lulumi.commands.onCommand.emit(command);
  });
});
