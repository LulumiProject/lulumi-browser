import { ipcMain, session } from 'electron';
import { runInNewContext } from 'vm';

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


const register = (eventName, digest, filter, func) => {
  webRequestMapping[eventName][digest] = runInNewContext(`eval(${func})`, {});
  session.defaultSession.webRequest[eventName](filter, (details, callback) => {
    callback(webRequestMapping[eventName][digest](details));
  });
};

const unregister = (eventName) => {
  session.defaultSession.webRequest[eventName]({}, null);
};

const webRequest = () => {
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event, digest, filter, func) => {
    register('onBeforeRequest', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', () => {
    unregister('onBeforeRequest');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event, digest, filter, func) => {
    register('onBeforeSendHeaders', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', () => {
    unregister('onBeforeSendHeaders');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event, digest, filter, func) => {
    register('onSendHeaders', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', () => {
    unregister('onSendHeaders');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event, digest, filter, func) => {
    register('onHeadersReceived', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', () => {
    unregister('onHeadersReceived');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event, digest, filter, func) => {
    register('onResponseStarted', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', () => {
    unregister('onResponseStarted');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event, digest, filter, func) => {
    register('onBeforeRedirect', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', () => {
    unregister('onBeforeRedirect');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event, digest, filter, func) => {
    register('onCompleted', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', () => {
    unregister('onCompleted');
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event, digest, filter, func) => {
    register('onErrorOccurred', digest, filter, func);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', () => {
    unregister('onErrorOccurred');
  });
};

export default {
  webRequest,
  onWillDownload(mainWindow, config) {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const itemURL = item.getURL();
      if (item.getMimeType() === 'application/pdf'
        && itemURL.indexOf('blob:') !== 0
        && itemURL.indexOf('#pdfjs.action=download') === -1
        && itemURL.indexOf('skip=true') === -1) {
        event.preventDefault();
        const qs = require('querystring');
        const param = qs.stringify({ file: itemURL });
        const PDFViewerURL = `file://${config.lulumiPDFJSPath}/web/viewer.html`;
        mainWindow.webContents.send('open-pdf', {
          location: `${PDFViewerURL}?${param}`,
          webContentsId: webContents.id,
        });
      } else {
        const totalBytes = item.getTotalBytes();
        const startTime = item.getStartTime();
        mainWindow.webContents.send('will-download-any-file', {
          webContentsId: webContents.id,
          name: item.getFilename(),
          url: item.getURL(),
          totalBytes,
          isPaused: item.isPaused(),
          canResume: item.canResume(),
          startTime,
          state: 'init',
        });

        ipcMain.on('pause-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.pause();
          }
        });
        ipcMain.on('resume-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.resume();
          }
        });
        ipcMain.on('cancel-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.cancel();
          }
        });

        item.on('updated', (event, state) => {
          mainWindow.webContents.send('update-downloads-progress', {
            startTime: item.getStartTime(),
            getReceivedBytes: item.getReceivedBytes(),
            savePath: item.getSavePath(),
            isPaused: item.isPaused(),
            canResume: item.canResume(),
            state,
          });
        });

        item.on('done', (event, state) => {
          ipcMain.removeAllListeners([
            'pause-downloads-progress',
            'resume-downloads-progress',
            'cancel-downloads-progress',
          ]);
          mainWindow.webContents.send('complete-downloads-progress', {
            name: item.getFilename(),
            startTime: item.getStartTime(),
            state,
          });
        });
      }
    });
  },
  setPermissionRequestHandler(mainWindow) {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      mainWindow.webContents.send('request-permission', {
        webContentsId: webContents.id,
        permission,
      });
      ipcMain.once(`response-permission-${webContents.id}`, (event, data) => {
        if (data.accept) {
          callback(true);
        } else {
          callback(false);
        }
      });
    });
  },
};
