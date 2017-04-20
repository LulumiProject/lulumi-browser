import { BrowserWindow, ipcMain, webContents } from 'electron';

ipcMain.on('open-dev-tools', (event, webContentsId) => {
  if (webContentsId) {
    webContents.fromId(webContentsId).openDevTools();
  }
});

ipcMain.on('lulumi-env-app-name', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-env-app-name', {
    webContentsId: event.sender.id,
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

ipcMain.on('lulumi-runtime-send-message', (event, extensionId, message, options) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-runtime-send-message', {
    extensionId,
    message,
    options,
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
