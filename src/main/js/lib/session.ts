import { api } from 'lulumi';
import { BrowserWindow, ipcMain, session } from 'electron';

/* tslint:disable:max-line-length */
/* tslint:disable:no-console */

const globalObjet = global as api.GlobalObject;

const register = (eventName: string, sess: Electron.Session, eventLispCaseName: string, sender: Electron.WebContents, digest: string, filter): void => {
  if (process.env.NODE_ENV === 'development') {
    filter.urls.push('*://localhost:9080/*');
  }
  sess.webRequest[eventName](filter, (details, callback) => {
    details.type = details.resourceType;
    details.tabId = (sess as any).id;

    const window = BrowserWindow.fromId(globalObjet.wid);
    window.webContents.send('lulumi-web-request-intercepted', {
      eventLispCaseName,
      digest,
      details,
      webContentsId: sender.id,
    });
    ipcMain.setMaxListeners(0);
    ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response-${digest}`, (event: Electron.Event, response) => {
      if (response) {
        callback(response);
      } else {
        callback({ cancel: false });
      }
    });
  });
};

const unregister = (eventName: string, sess: Electron.Session, eventLispCaseName: string, sender: Electron.WebContents, remove: boolean = false): void => {
  if (remove) {
    sess.webRequest[eventName]({}, null);
  }
};

const registerWebRequest = (sess: Electron.Session): void => {
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRequest', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onBeforeRequest', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeSendHeaders', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onBeforeSendHeaders', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onSendHeaders', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onSendHeaders', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onHeadersReceived', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onHeadersReceived', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onResponseStarted', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onResponseStarted', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRedirect', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onBeforeRedirect', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onCompleted', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onCompleted', sess, eventLispCaseName, event.sender, remove);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event: Electron.Event, eventLispCaseName: string, digest: string, filter): void => {
    register('onErrorOccurred', sess, eventLispCaseName, event.sender, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', (event: Electron.Event, eventLispCaseName: string, remove: boolean): void => {
    unregister('onErrorOccurred', sess, eventLispCaseName, event.sender, remove);
  });
};

const registerScheme = (partition: string, scheme: string): void => {
  const sess = session.fromPartition(partition, { cache: true });
  (sess as any).id = partition;
  registerWebRequest(sess);
  /*
  if (process.env.NODE_ENV === 'development') {
    sess.protocol.registerHttpProtocol('lulumi', (request, callback) => {
      const url: string = request.url.substr(scheme.length);
      const [type, param] = url.split('/');
      if (type === 'about') {
        if (param.indexOf('#') === 0) {
          callback({
            url: `${path}/about.html`,
            method: request.method,
          });
        } else {
          callback({
            url: `${path}/${param}`,
            method: request.method,
          });
        }
      }
      // tslint:disable-next-line:align
    }, (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    });
  } else {
    sess.protocol.registerFileProtocol('lulumi', (request, callback) => {
      const url: string = request.url.substr(scheme.length);
      const [type, param] = url.split('/');
      if (type === 'about') {
        if (param.indexOf('#') === 0) {
          callback(`${__dirname}/about.html`);
        } else {
          callback(`${__dirname}/${param}`);
        }
      }
      // tslint:disable-next-line:align
    }, (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    });
  }
  */
  sess.protocol.registerFileProtocol('lulumi', (request, callback) => {
    const path = require('path').resolve(__dirname, '../../../../dist');
    const url: string = request.url.substr(scheme.length);
    const [type, param] = url.split('/');
    if (type === 'about') {
      if (param.indexOf('#') === 0) {
        callback(`${path}/about.html`);
      } else {
        callback(`${path}/${param}`);
      }
    }
    // tslint:disable-next-line:align
  }, (error) => {
    if (error) {
      console.error('Failed to register protocol');
    }
  });
};

export default {
  registerScheme,
  onWillDownload(partition: string, mainWindow: Electron.BrowserWindow, path: string): void {
    const sess = session.fromPartition(partition, { cache: true });
    sess.on('will-download', (event, item, webContents) => {
      const itemURL = item.getURL();
      if (item.getMimeType() === 'application/pdf'
        && itemURL.indexOf('blob:') !== 0
        && itemURL.indexOf('#pdfjs.action=download') === -1
        && itemURL.indexOf('skip=true') === -1) {
        event.preventDefault();
        const qs = require('querystring');
        const param = qs.stringify({ file: itemURL });
        const pdfViewerURL = `file://${path}/web/viewer.html`;
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
  },
  setPermissionRequestHandler(partition: string, mainWindow: Electron.BrowserWindow): void {
    const sess = session.fromPartition(partition, { cache: true });
    sess.setPermissionRequestHandler((webContents, permission, callback) => {
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
  },
};
