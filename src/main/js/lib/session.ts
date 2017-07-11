import { ipcMain, session } from 'electron';
import { runInNewContext } from 'vm';

/* tslint:disable:max-line-length */

const webRequestMapping = {
  onBeforeRequest: {},
  onBeforeSendHeaders: {},
  onSendHeaders: {},
  onHeadersReceived: {},
  onResponseStarted: {},
  onBeforeRedirect: {},
  onCompleted: {},
  onErrorOccurred: {},
};


const register = (eventName: string, digest: string, filter, func: string): void => {
  webRequestMapping[eventName][digest] = runInNewContext(`eval(${func})`, {});
  if (typeof session.defaultSession !== 'undefined') {
    session.defaultSession.webRequest[eventName](filter, (details, callback) => {
      callback(webRequestMapping[eventName][digest](details));
    });
  }
};

const unregister = (eventName: string): void => {
  if (typeof session.defaultSession !== 'undefined') {
    session.defaultSession.webRequest[eventName]({}, null);
  }
};

const webRequest = () => {
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onBeforeRequest', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', (): void => {
    unregister('onBeforeRequest');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onBeforeSendHeaders', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', (): void => {
    unregister('onBeforeSendHeaders');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onSendHeaders', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', (): void => {
    unregister('onSendHeaders');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onHeadersReceived', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', (): void => {
    unregister('onHeadersReceived');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onResponseStarted', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', (): void => {
    unregister('onResponseStarted');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onBeforeRedirect', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', (): void => {
    unregister('onBeforeRedirect');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onCompleted', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', (): void => {
    unregister('onCompleted');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event: Electron.Event, digest: string, filter, func: string): void => {
    register('onErrorOccurred', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', (): void => {
    unregister('onErrorOccurred');
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
