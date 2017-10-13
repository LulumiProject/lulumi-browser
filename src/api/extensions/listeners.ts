import { BrowserWindow, dialog, ipcMain, webContents } from 'electron';

const windows = require('../../shared/store/mainStore').default.getWindows();

/* tslint:disable:max-line-length */

ipcMain.on('open-dev-tools', (event, webContentsId) => {
  if (webContentsId) {
    webContents.fromId(webContentsId).openDevTools();
  }
});
ipcMain.on('add-lulumi-extension', (event) => {
  dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirs) => {
    if (dirs) {
      const dir: string = dirs[0];
      let name: string = '';
      let result: string = 'OK';
      try {
        if (dir) {
          // an array of directory paths chosen by the user will be returned, but we only want one path
          name = (BrowserWindow as any).addLulumiExtension(dir);
        }
      } catch (readError) {
        result = readError.message;
      }

      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('add-lulumi-extension-result', {
          name,
          result,
        });
      });
      event.sender.send('add-lulumi-extension-result', {
        name,
        result,
      });
    }
  });
});
ipcMain.on('remove-lulumi-extension', (event, extensionId) => {
  let result: string = 'OK';
  try {
    const ret: string = (BrowserWindow as any).removeLulumiExtension(extensionId);
    ipcMain.once(`remove-lulumi-extension-${extensionId}`, () => {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('remove-lulumi-extension-result', {
          extensionId,
          result,
        });
      });
      event.sender.send('remove-lulumi-extension-result', {
        extensionId,
        result,
      });
    });
    if (ret === '') {
      result = `ENOENT: Extension ${extensionId} not found!`;
    }
  } catch (removeError) {
    result = removeError.message;
  }
});

ipcMain.on('lulumi-env-app-name', (event) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-env-app-name', {
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-env-app-version', (event) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-env-app-version', {
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-browser-action-set-icon', (event, extensionId, startPage, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-set-icon', {
      extensionId,
      startPage,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-browser-action-set-badge-text', (event, extensionId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-set-badge-text', {
      extensionId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-browser-action-set-badge-background-color', (event, extensionId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-set-badge-background-color', {
      extensionId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-browser-action-add-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-browser-action-remove-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-browser-action-emit-on-message', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-browser-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-page-action-set-icon', (event, extensionId, startPage, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-set-icon', {
      extensionId,
      startPage,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-page-action-show', (event, tabId, extensionId, enabled) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-show', {
      tabId,
      extensionId,
      enabled,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-page-action-hide', (event, tabId, extensionId, enabled) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-hide', {
      tabId,
      extensionId,
      enabled,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-page-action-add-listener-on-clicked', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-add-listener-on-clicked', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-page-action-remove-listener-on-clicked', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-remove-listener-on-clicked', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-page-action-emit-on-clicked', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-page-action-emit-on-clicked', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-commands-add-listener-on-command', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-commands-add-listener-on-command', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-commands-remove-listener-on-command', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-commands-remove-listener-on-command', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-commands-emit-on-command', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-commands-emit-on-command', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-alarms-get', (event, name) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-get', {
      name,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-get-all', (event) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-get-all', {
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-clear', (event, name) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-clear', {
      name,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-clear-all', (event) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-clear-all', {
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-create', (event, name, alarmInfo) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-create', {
      name,
      alarmInfo,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-add-listener-on-alarm', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-add-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-remove-listener-on-alarm', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-remove-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-alarms-emit-on-alarm', (event, alarm) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-alarms-emit-on-alarm', {
      alarm,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-runtime-send-message', (event, extensionId, message, external) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-send-message', {
      extensionId,
      message,
      external,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-add-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-remove-listener-on-message', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-emit-on-message', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-add-listener-on-message-external', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-add-listener-on-message-external', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-remove-listener-on-message-external', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-remove-listener-on-message-external', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-runtime-emit-on-message-external', (event, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-runtime-emit-on-message-external', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-tabs-get', (event, tabId) => {
  // event.sender.send('lulumi-tabs-get-result', store.getters.tabs.find(tab => (tab.id === tabId)));
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-get', {
      tabId,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-get-current', (event, guestInstanceId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-get-current', {
      guestInstanceId,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-duplicate', (event, tabId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-duplicate', {
      tabId,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-query', (event, queryInfo) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-query', {
      queryInfo,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-update', (event, tabId, updateProperties) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-update', {
      tabId,
      updateProperties,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-reload', (event, tabId, reloadProperties) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-reload', {
      tabId,
      reloadProperties,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-create', (event, createProperties) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-create', {
      createProperties,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-remove', (event, tabIds) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-remove', {
      tabIds,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-detect-language', (event, tabId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-detect-language', {
      tabId,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-detect-language-result', (event, value, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-detect-language-result', {
      value,
      webContentsId,
    });
  });
});
ipcMain.on('lulumi-tabs-execute-script', (event, tabId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-execute-script', {
      tabId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-insert-css', (event, tabId, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-insert-css', {
      tabId,
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-send-message', (event, tabId, message) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-send-message', {
      tabId,
      message,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-add-listener-on-activated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-add-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-remove-listener-on-activated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-remove-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-emit-on-activated', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-emit-on-activated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-add-listener-on-updated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-add-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-remove-listener-on-updated', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-remove-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-emit-on-updated', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-emit-on-updated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-add-listener-on-created', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-add-listener-on-created', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-remove-listener-on-created', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-emit-on-created', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-emit-on-created', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-add-listener-on-removed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-add-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-remove-listener-on-removed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-emit-on-removed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-tabs-emit-on-removed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-windows-get', (event, windowId, getInfo) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-windows-get', {
      windowId,
      getInfo,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-windows-get-current', (event, getInfo, guestInstanceId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-windows-get-current', {
      getInfo,
      guestInstanceId,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-windows-get-all', (event, getInfo) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-windows-get-all', {
      getInfo,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-storage-add-listener-on-changed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-storage-add-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-storage-remove-listener-on-changed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-storage-remove-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-storage-emit-on-changed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-storage-emit-on-changed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-context-menus-create', (event, menuItems) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-context-menus-create', {
      menuItems,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-context-menus-remove', (event, menuItems) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-context-menus-remove', {
      menuItems,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-context-menus-remove-all', (event, menuItems) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-context-menus-remove-all', {
      menuItems,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-web-navigation-get-frame', (event, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-get-frame', {
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-get-frame-result', (event, details, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-get-frame-result', {
      details,
      webContentsId,
    });
  });
});
ipcMain.on('lulumi-web-navigation-get-all-frames', (event, details) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-get-all-frames', {
      details,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-get-all-frames-result', (event, details, webContentsId) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-get-all-frames-result', {
      details,
      webContentsId,
    });
  });
});
ipcMain.on('lulumi-web-navigation-add-listener-on-before-navigate', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-add-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-remove-listener-on-before-navigate', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-remove-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-emit-on-before-navigate', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-emit-on-before-navigate', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-add-listener-on-committed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-add-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-remove-listener-on-committed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-remove-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-emit-on-committed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-emit-on-committed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-add-listener-on-dom-content-loaded', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-add-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-remove-listener-on-dom-content-loaded', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-remove-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-emit-on-dom-content-loaded', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-emit-on-dom-content-loaded', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-add-listener-on-completed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-add-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-remove-listener-on-completed', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-remove-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-emit-on-completed', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-emit-on-completed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-add-listener-on-created-navigation-target', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-add-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-remove-listener-on-created-navigation-target', (event, digest) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-remove-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-web-navigation-emit-on-created-navigation-target', (event, args) => {
  Object.keys(windows).forEach((key) => {
    const id = parseInt(key, 10);
    const window = windows[id];
    window.webContents.send('lulumi-web-navigation-emit-on-created-navigation-target', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
