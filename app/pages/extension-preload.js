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

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.on('lulumi-runtime-send-message', (event, message, sender) => {
    global.lulumi.runtime.onMessage.emit(message, sender);
  });
  ipcRenderer.on('lulumi-page-action-clicked', (event, tab) => {
    global.lulumi.tabs.get(tab.id, tab => global.lulumi.pageAction.onClicked.emit(tab));
  });
  ipcRenderer.on('lulumi-commands-triggered', (event, command) => {
    global.lulumi.commands.onCommand.emit(command);
  });
});
