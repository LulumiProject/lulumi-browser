import { ipcMain, session } from 'electron';

/* tslint:disable:max-line-length */

const register = (eventName: string, eventLispCaseName: string, sender: Electron.WebContents, digest: string, filter): void => {
  if (typeof session.defaultSession !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      filter.urls.push('*://localhost:9080/*');
    }
    session.defaultSession.webRequest[eventName](filter, (details, callback) => {
      details.type = details.resourceType;
      details.tabId = 0;

      sender.send(`lulumi-web-request-${eventLispCaseName}-intercepted`, details);
      ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response`, (event: Electron.Event, response) => {
        if (response) {
          callback(response);
        } else {
          callback({ cancel: false });
        }
      });
    });
  }
};

const unregister = (eventName: string, eventLispCaseName: string, sender: Electron.WebContents): void => {
  if (typeof session.defaultSession !== 'undefined') {
    session.defaultSession.webRequest[eventName]({}, null);
  }
};

const webRequest = () => {
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRequest', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onBeforeRequest', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeSendHeaders', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onBeforeSendHeaders', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onSendHeaders', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onSendHeaders', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onHeadersReceived', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onHeadersReceived', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onResponseStarted', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onResponseStarted', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRedirect', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onBeforeRedirect', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onCompleted', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onCompleted', eventLispCaseName, event.sender);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onErrorOccurred', eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', (event: Electron.Event, eventLispCaseName: string): void => {
    unregister('onErrorOccurred', eventLispCaseName, event.sender);
  });
};

export default {
  webRequest,
  onWillDownload(mainWindow: Electron.BrowserWindow, config): void {
    if (typeof session.defaultSession !== 'undefined') {
      session.defaultSession.on('will-download', (event, item, webContents) => {
        const itemURL = item.getURL();
        if (item.getMimeType() === 'application/pdf'
          && itemURL.indexOf('blob:') !== 0
          && itemURL.indexOf('#pdfjs.action=download') === -1
          && itemURL.indexOf('skip=true') === -1) {
          event.preventDefault();
          const qs = require('querystring');
          const param = qs.stringify({ file: itemURL });
          const pdfViewerURL = `file://${config.lulumiPDFJSPath}/web/viewer.html`;
          mainWindow.webContents.send('open-pdf', {
            location: `${pdfViewerURL}?${param}`,
            webContentsId: webContents.id,
          });
        } else {
          const totalBytes = item.getTotalBytes();
          const startTime = item.getStartTime();
          mainWindow.webContents.send('will-download-any-file', {
            totalBytes,
            startTime,
            webContentsId: webContents.id,
            name: item.getFilename(),
            url: item.getURL(),
            isPaused: item.isPaused(),
            canResume: item.canResume(),
            state: 'init',
          });

          ipcMain.on('pause-downloads-progress', (event: Electron.Event, remoteStartTime: number) => {
            if (startTime === remoteStartTime) {
              item.pause();
            }
          });
          ipcMain.on('resume-downloads-progress', (event: Electron.Event, remoteStartTime: number) => {
            if (startTime === remoteStartTime) {
              item.resume();
            }
          });
          ipcMain.on('cancel-downloads-progress', (event: Electron.Event, remoteStartTime: number) => {
            if (startTime === remoteStartTime) {
              item.cancel();
            }
          });

          item.on('updated', (event: Electron.Event, state: string) => {
            mainWindow.webContents.send('update-downloads-progress', {
              state,
              startTime: item.getStartTime(),
              getReceivedBytes: item.getReceivedBytes(),
              savePath: item.getSavePath(),
              isPaused: item.isPaused(),
              canResume: item.canResume(),
            });
          });

          item.on('done', (event: Electron.Event, state: string) => {
            ipcMain.removeAllListeners('pause-downloads-progress');
            ipcMain.removeAllListeners('resume-downloads-progress');
            ipcMain.removeAllListeners('cancel-downloads-progress');
            mainWindow.webContents.send('complete-downloads-progress', {
              state,
              name: item.getFilename(),
              startTime: item.getStartTime(),
            });
          });
        }
      });
    }
  },
  setPermissionRequestHandler(mainWindow: Electron.BrowserWindow): void {
    if (typeof session.defaultSession !== 'undefined') {
      session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        mainWindow.webContents.send('request-permission', {
          permission,
          webContentsId: webContents.id,
        });
        ipcMain.once(`response-permission-${webContents.id}`, (event: Electron.Event, data) => {
          if (data.accept) {
            callback(true);
          } else {
            callback(false);
          }
        });
      });
    }
  },
};
