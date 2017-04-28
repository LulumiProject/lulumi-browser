import { BrowserWindow, dialog, ipcMain, webContents } from 'electron';

ipcMain.on('open-dev-tools', (event, webContentsId) => {
  if (webContentsId) {
    webContents.fromId(webContentsId).openDevTools();
  }
});
ipcMain.on('add-extension', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  dialog.showOpenDialog(window, {
    properties: ['openDirectory'],
  }, (dirs) => {
    if (dirs) {
      // an array of diretory paths chosen by the user will be returned, but we only want one path
      BrowserWindow.addExtension(dirs[0]);
      BrowserWindow.getAllWindows()[0]
        .webContents.send('add-extension-result', dirs[0]);
      event.sender.send('add-extension-result', dirs[0]);
    }
  });
});
ipcMain.on('remove-extension', (event, name) => {
  try {
    BrowserWindow.removeExtension(name);
    BrowserWindow.getAllWindows()[0]
    .webContents.send('remove-extension-result', 'OK');
    event.sender.send('remove-extension-result', 'OK');
  } catch (removeError) {
    BrowserWindow.getAllWindows()[0]
    .webContents.send('remove-extension-result', removeError);
    event.sender.send('remove-extension-result', removeError);
  }
});

ipcMain.on('lulumi-env-app-name', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-env-app-name', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-env-app-version', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-env-app-version', {
    webContentsId: event.sender.id,
  });
});

ipcMain.once('lulumi-browser-action-on-message', (event) => {
  ipcMain.on('lulumi-browser-action-add-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-browser-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-browser-action-remove-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-browser-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-browser-action-emit-on-message', (event, message) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-browser-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-page-action-show', (event, tabId, extensionId, enabled) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-page-action-show', {
    tabId,
    extensionId,
    enabled,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-page-action-hide', (event, tabId, extensionId, enabled) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-page-action-hide', {
    tabId,
    extensionId,
    enabled,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-page-action-on-message', (event) => {
  ipcMain.on('lulumi-page-action-add-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-page-action-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-page-action-remove-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-page-action-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-page-action-emit-on-message', (event, message) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-page-action-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-alarms-get', (event, name) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-alarms-get', {
    name,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-get-all', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-alarms-get-all', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-clear', (event, name) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-alarms-clear', {
    name,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-clear-all', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-alarms-clear-all', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-alarms-create', (event, name, alarmInfo) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-alarms-create', {
    name,
    alarmInfo,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-alarms-on-alarm', (event) => {
  ipcMain.on('lulumi-alarms-add-listener-on-alarm', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-alarms-add-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-alarms-remove-listener-on-alarm', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-alarms-remove-listener-on-alarm', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-alarms-emit-on-alarm', (event, alarm) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-alarms-emit-on-alarm', {
      alarm,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.on('lulumi-tabs-get', (event, tabId) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-get', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-get-current', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-get-current', {
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-duplicate', (event, tabId) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-duplicate', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-query', (event, queryInfo) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-query', {
    queryInfo,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-update', (event, tabId, updateProperties) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-update', {
    tabId,
    updateProperties,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-reload', (event, tabId, reloadProperties) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-reload', {
    tabId,
    reloadProperties,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-remove', (event, tabIds) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-remove', {
    tabIds,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-detect-language', (event, tabId) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-detect-language', {
    tabId,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-detect-language-result', (event, value, webContentsId) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-detect-language-result', {
    value,
    webContentsId,
  });
});
ipcMain.on('lulumi-tabs-execute-script', (event, tabId, details) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-execute-script', {
    tabId,
    details,
    webContentsId: event.sender.id,
  });
});
ipcMain.on('lulumi-tabs-insert-css', (event, tabId, details) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-insert-css', {
    tabId,
    details,
    webContentsId: event.sender.id,
  });
});

ipcMain.on('lulumi-runtime-send-message', (event, extensionId, message) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-runtime-send-message', {
    extensionId,
    message,
    webContentsId: event.sender.id,
  });
});
ipcMain.once('lulumi-runtime-on-message', (event) => {
  ipcMain.on('lulumi-runtime-add-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-runtime-add-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-runtime-remove-listener-on-message', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-runtime-remove-listener-on-message', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-runtime-emit-on-message', (event, message) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-runtime-emit-on-message', {
      message,
      sender: event.sender,
      webContentsId: event.sender.id,
    });
  });
});
ipcMain.on('lulumi-tabs-send-message', (event, tabId, message) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-send-message', {
    tabId,
    message,
    webContentsId: event.sender.id,
  });
});

ipcMain.once('lulumi-tabs-on-updated', (event) => {
  ipcMain.on('lulumi-tabs-add-listener-on-updated', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-add-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-updated', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-remove-listener-on-updated', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-updated', (event, args) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-emit-on-updated', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.once('lulumi-tabs-on-created', (event) => {
  ipcMain.on('lulumi-tabs-add-listener-on-created', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-add-listener-on-created', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-created', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-created', (event, args) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-emit-on-created', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.once('lulumi-tabs-on-removed', (event) => {
  ipcMain.on('lulumi-tabs-add-listener-on-removed', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-add-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-remove-listener-on-removed', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-remove-listener-on-removed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-tabs-emit-on-removed', (event, args) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-tabs-emit-on-removed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});

ipcMain.once('lulumi-storage-on-changed', (event) => {
  ipcMain.on('lulumi-storage-add-listener-on-changed', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-storage-add-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-storage-remove-listener-on-changed', (event, digest) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-storage-remove-listener-on-changed', {
      digest,
      webContentsId: event.sender.id,
    });
  });
  ipcMain.on('lulumi-storage-emit-on-changed', (event, args) => {
    BrowserWindow.getAllWindows()[0]
      .webContents.send('lulumi-storage-emit-on-changed', {
      args,
      webContentsId: event.sender.id,
    });
  });
});
