/* eslint-disable no-unused-vars */

const fakeElectron = {
  BrowserWindow: {
    getFocusedWindow() {
      return {
        id: 1,
      };
    },
    getActiveWindow() {
      return {
        id: 1,
      };
    },
  },
  ipcMain: {
    on() { },
    send() { },
  },
  ipcRenderer: {
    on() { },
    send() { },
  },
  remote: {
    app: {
      on() {
      },
    },
    clipboard: {
      readText() { return ''; },
    },
    getCurrentWindow() {
      return {
        on: () => {},
        isFocused: () => true,
        isFullScreen: () => false,
        isMaximized: () => false,
        webContents: {},
      };
    },
    Menu: {
      buildFromTemplate: template => require('./fakeElectronMenu'),
    },
  },
  app: {
    on() {
    },
    getPath: param => `${process.cwd()}/${param}`,
    getVersion: () => '0.14.0',
    setLocale: (locale) => {},
    exit: () => {},
  },
  clipboard: {
    writeText() {
    },
  },
  dialog: {
    showOpenDialog() { },
  },
  shell: {
    openExternal() {
    },
    showItemInFolder() {
    },
    openPath() {
    },
    beep() {
    },
    moveItemToTrash() {
    },
  },
  session: {
    defaultSession: {
      partition: 'default',
    },
  },
};

module.exports = fakeElectron;
