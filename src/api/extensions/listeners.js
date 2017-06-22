import { BrowserWindow, dialog, ipcMain, webContents } from 'electron';

ipcMain.on('open-dev-tools', (event, webContentsId) => {
  if (webContentsId) {
    webContents.fromId(webContentsId).openDevTools();
  }
});
ipcMain.on('add-extension', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }, (dirs) => {
    if (dirs) {
      // an array of diretory paths chosen by the user will be returned, but we only want one path
      BrowserWindow.addExtension(dirs[0]);

      window.webContents.send('add-extension-result', dirs[0]);
      event.sender.send('add-extension-result', dirs[0]);
    }
  });
});
ipcMain.on('remove-extension', (event, name) => {
  const window = BrowserWindow.fromId(global.wid);
  try {
    BrowserWindow.removeExtension(name);

    window.webContents.send('remove-extension-result', 'OK');
    event.sender.send('remove-extension-result', 'OK');
  } catch (removeError) {
    window.webContents.send('remove-extension-result', removeError);
    event.sender.send('remove-extension-result', removeError);
  }
});

ipcMain.on('lulumi-env-app-name', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-env-app-name', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-env-app-version', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-env-app-version', {
    webContentsId: event.sender.id,
  });
});

ipcMain.on('lulumi-browser-action-set-icon', (event, extensionId, startPage, details) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-browser-action-set-icon', {
    extensionId,
    startPage,
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-browser-action-on-message', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-browser-action-add-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-browser-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-browser-action-remove-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-browser-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-browser-action-emit-on-message', (event, message) => {
    window.webContents.send('lulumi-browser-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-page-action-show', (event, tabId, extensionId, enabled) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-page-action-show', {
    tabId,
    extensionId,
    enabled,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-page-action-hide', (event, tabId, extensionId, enabled) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-page-action-hide', {
    tabId,
    extensionId,
    enabled,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-page-action-on-message', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-page-action-add-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-page-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-page-action-remove-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-page-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-page-action-emit-on-message', (event, message) => {
    window.webContents.send('lulumi-page-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-alarms-get', (event, name) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-alarms-get', {
    name,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-get-all', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-alarms-get-all', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-clear', (event, name) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-alarms-clear', {
    name,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-clear-all', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-alarms-clear-all', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-create', (event, name, alarmInfo) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-alarms-create', {
    name,
    alarmInfo,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-alarms-on-alarm', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-alarms-add-listener-on-alarm', (event, digest) => {
    window.webContents.send('lulumi-alarms-add-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-alarms-remove-listener-on-alarm', (event, digest) => {
    window.webContents.send('lulumi-alarms-remove-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-alarms-emit-on-alarm', (event, alarm) => {
    window.webContents.send('lulumi-alarms-emit-on-alarm', {
      alarm,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-runtime-send-message', (event, extensionId, message, external) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-runtime-send-message', {
    extensionId,
    message,
    external,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-runtime-on-message', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-runtime-add-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-runtime-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-runtime-remove-listener-on-message', (event, digest) => {
    window.webContents.send('lulumi-runtime-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-runtime-emit-on-message', (event, message) => {
    window.webContents.send('lulumi-runtime-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-tabs-get', (event, tabId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-get', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-get-current', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-get-current', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-duplicate', (event, tabId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-duplicate', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-query', (event, queryInfo) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-query', {
    queryInfo,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-update', (event, tabId, updateProperties) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-update', {
    tabId,
    updateProperties,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-reload', (event, tabId, reloadProperties) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-reload', {
    tabId,
    reloadProperties,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-remove', (event, tabIds) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-remove', {
    tabIds,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-detect-language', (event, tabId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-detect-language', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-detect-language-result', (event, value, webContentsId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-detect-language-result', {
    value,
    webContentsId,
  });
});
ipcMain.on('lulumi-tabs-execute-script', (event, tabId, details) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-execute-script', {
    tabId,
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-insert-css', (event, tabId, details) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-insert-css', {
    tabId,
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-send-message', (event, tabId, message) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-tabs-send-message', {
    tabId,
    message,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-tabs-on-activated', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-tabs-add-listener-on-activated', (event, digest) => {
    window.webContents.send('lulumi-tabs-add-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-activated', (event, digest) => {
    window.webContents.send('lulumi-tabs-remove-listener-on-activated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-activated', (event, args) => {
    window.webContents.send('lulumi-tabs-emit-on-activated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-tabs-on-updated', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-tabs-add-listener-on-updated', (event, digest) => {
    window.webContents.send('lulumi-tabs-add-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-updated', (event, digest) => {
    window.webContents.send('lulumi-tabs-remove-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-updated', (event, args) => {
    window.webContents.send('lulumi-tabs-emit-on-updated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-tabs-on-created', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-tabs-add-listener-on-created', (event, digest) => {
    window.webContents.send('lulumi-tabs-add-listener-on-created', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-created', (event, digest) => {
    window.webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-created', (event, args) => {
    window.webContents.send('lulumi-tabs-emit-on-created', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-tabs-on-removed', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-tabs-add-listener-on-removed', (event, digest) => {
    window.webContents.send('lulumi-tabs-add-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-removed', (event, digest) => {
    window.webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-removed', (event, args) => {
    window.webContents.send('lulumi-tabs-emit-on-removed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.once('lulumi-storage-on-changed', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-storage-add-listener-on-changed', (event, digest) => {
    window.webContents.send('lulumi-storage-add-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-storage-remove-listener-on-changed', (event, digest) => {
    window.webContents.send('lulumi-storage-remove-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-storage-emit-on-changed', (event, args) => {
    window.webContents.send('lulumi-storage-emit-on-changed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-context-menus-create', (event, menuItems) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-context-menus-create', {
    menuItems,
    webContentsId: event.sender.id,
  });
});

ipcMain.on('lulumi-web-navigation-get-frame', (event, details) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-web-navigation-get-frame', {
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-web-navigation-get-frame-result', (event, details, webContentsId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-web-navigation-get-frame-result', {
    details,
    webContentsId,
  });
});
ipcMain.on('lulumi-web-navigation-get-all-frames', (event, details) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-web-navigation-get-all-frames', {
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-web-navigation-get-all-frames-result', (event, details, webContentsId) => {
  const window = BrowserWindow.fromId(global.wid);
  window.webContents.send('lulumi-web-navigation-get-all-frames-result', {
    details,
    webContentsId,
  });
});
ipcMain.once('lulumi-web-navigation-on-before-navigate', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-web-navigation-add-listener-on-before-navigate', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-add-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-remove-listener-on-before-navigate', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-remove-listener-on-before-navigate', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-emit-on-before-navigate', (event, args) => {
    window.webContents.send('lulumi-web-navigation-emit-on-before-navigate', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-web-navigation-on-committed', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-web-navigation-add-listener-on-committed', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-add-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-remove-listener-on-committed', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-remove-listener-on-committed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-emit-on-committed', (event, args) => {
    window.webContents.send('lulumi-web-navigation-emit-on-committed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-web-navigation-on-dom-content-loaded', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-web-navigation-add-listener-on-dom-content-loaded', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-add-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-remove-listener-on-dom-content-loaded', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-remove-listener-on-dom-content-loaded', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-emit-on-dom-content-loaded', (event, args) => {
    window.webContents.send('lulumi-web-navigation-emit-on-dom-content-loaded', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-web-navigation-on-completed', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-web-navigation-add-listener-on-completed', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-add-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-remove-listener-on-completed', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-remove-listener-on-completed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-emit-on-completed', (event, args) => {
    window.webContents.send('lulumi-web-navigation-emit-on-completed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.once('lulumi-web-navigation-on-created-navigation-target', (event) => {
  const window = BrowserWindow.fromId(global.wid);
  ipcMain.on('lulumi-web-navigation-add-listener-on-created-navigation-target', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-add-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-remove-listener-on-created-navigation-target', (event, digest) => {
    window.webContents.send('lulumi-web-navigation-remove-listener-on-created-navigation-target', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-web-navigation-emit-on-created-navigation-target', (event, args) => {
    window.webContents.send('lulumi-web-navigation-emit-on-created-navigation-target', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
