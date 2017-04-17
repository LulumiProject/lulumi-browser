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

ipcMain.on('lulumi-tabs-get-current', (event) => {
  BrowserWindow.getAllWindows()[0]
    .webContents.send('lulumi-tabs-get-current', {
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
