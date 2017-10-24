import axios from 'axios';
import { BrowserWindow, ipcMain, session } from 'electron';

import mainStore from '../../../shared/store/mainStore';

/* tslint:disable:max-line-length */
/* tslint:disable:no-console */
/* tslint:disable:object-shorthand-properties-first */
/* tslint:disable:align */

ipcMain.setMaxListeners(0);

const register = (eventName: any, sess: Electron.Session, eventLispCaseName: string, id: number, digest: string, filter): void => {
  if ((eventName === 'onBeforeRequest') || (eventName === 'onBeforeSendHeaders')) {
    sess.webRequest[eventName](filter, (details, callback) => {
      if (details.resourceType === 'mainFrame') {
        details.type = 'main_frame';
      } else if (details.resourceType === 'subFrame') {
        details.type = 'sub_frame';
      } else if (details.resourceType === 'cspReport') {
        details.type = 'csp_report';
      } else {
        details.type = details.resourceType;
      }

      if (details.requestHeaders) {
        const requestHeaders: object[] = [];
        Object.keys(details.requestHeaders).forEach((k) => {
          requestHeaders.push({ name: k, value: details.requestHeaders[k][0] });
        });
        details.requestHeaders = requestHeaders;
      }

      ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response-${digest}`, (event: Electron.Event, response) => {
        if (response) {
          callback(response);
        } else {
          callback({ cancel: false });
        }
      });
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.send('lulumi-web-request-intercepted', {
        eventLispCaseName,
        digest,
        details,
        webContentsId: id,
      });
    });
  } else if (eventName === 'onHeadersReceived') {
    sess.webRequest[eventName](filter, (details, callback) => {
      details.type = details.resourceType;

      if (details.responseHeaders) {
        const responseHeaders: object[] = [];
        Object.keys(details.responseHeaders).forEach((k) => {
          responseHeaders.push({ name: k, value: details.responseHeaders[k][0] });
        });
        details.responseHeaders = responseHeaders;
      }

      ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response-${digest}`, (event: Electron.Event, response) => {
        if (response) {
          callback(response);
        } else {
          callback({ cancel: false });
        }
      });
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.send('lulumi-web-request-intercepted', {
        eventLispCaseName,
        digest,
        details,
        webContentsId: id,
      });
    });
  } else {
    sess.webRequest[eventName](filter, (details) => {
      details.type = details.resourceType;

      if (details.requestHeaders) {
        const requestHeaders: object[] = [];
        Object.keys(details.requestHeaders).forEach((k) => {
          requestHeaders.push({ name: k, value: details.requestHeaders[k][0] });
        });
        details.requestHeaders = requestHeaders;
      }
      if (details.responseHeaders) {
        const responseHeaders: object[] = [];
        Object.keys(details.responseHeaders).forEach((k) => {
          responseHeaders.push({ name: k, value: details.responseHeaders[k][0] });
        });
        details.responseHeaders = responseHeaders;
      }

      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.send('lulumi-web-request-intercepted', {
        eventLispCaseName,
        digest,
        details,
        webContentsId: id,
      });
    });
  }
};

const unregister = (eventName: string, sess: Electron.Session): void => {
  sess.webRequest[eventName]({}, null);
};

const registerWebRequestListeners = (): void => {
  const sess = session.defaultSession as Electron.Session;
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRequest', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onBeforeRequest', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeSendHeaders', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onBeforeSendHeaders', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onSendHeaders', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onSendHeaders', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onHeadersReceived', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onHeadersReceived', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onResponseStarted', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onResponseStarted', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRedirect', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onBeforeRedirect', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onCompleted', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onCompleted', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event: Electron.Event, extensionName: string, eventLispCaseName: string, digest: string, filter): void => {
    register('onErrorOccurred', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', (event: Electron.Event, extensionName: string, eventLispCaseName: string): void => {
    unregister('onErrorOccurred', sess);
  });
};

const registerScheme = (scheme: string): void => {
  const sess = session.defaultSession as Electron.Session;
  if (process.env.NODE_ENV === 'development') {
    sess.protocol.registerBufferProtocol('lulumi', (request, callback) => {
      const url: string = request.url.substr(scheme.length);
      const [type, param] = url.split('/');
      if (type === 'about') {
        if (param.indexOf('#') === 0) {
          axios.get(`http://localhost:${require('../../../../.electron-vue/config').port}/about.html`).then((response) => {
            callback({
              mimeType: 'text/html',
              data: Buffer.from(response.data, 'utf8'),
            });
          });
        } else {
          axios.get(`http://localhost:${require('../../../../.electron-vue/config').port}/${param}`).then((response) => {
            callback({
              mimeType: 'text/html',
              data: Buffer.from(response.data, 'utf8'),
            });
          });
        }
      }
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
    }, (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    });
  }
};

const registerCertificateVerifyProc = () => {
  const sess = session.defaultSession as Electron.Session;
  const store = mainStore.getStore();
  sess.setCertificateVerifyProc((request, callback) => {
    store.dispatch('updateCertificate', {
      hostname: request.hostname,
      certificate: request.certificate,
      verificationResult: request.verificationResult,
      errorCode: request.errorCode,
    });
    if (request.verificationResult !== 'net::OK') {
      callback(-3);
    } else {
      callback(0);
    }
  });
};

const onWillDownload = (mainWindow: Electron.BrowserWindow, path: string): void => {
  const sess = session.defaultSession as Electron.Session;
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
        url: `${pdfViewerURL}?${param}`,
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
        dataState: 'init',
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
          startTime: item.getStartTime(),
          getReceivedBytes: item.getReceivedBytes(),
          savePath: item.getSavePath(),
          isPaused: item.isPaused(),
          canResume: item.canResume(),
          dataState: state,
        });
      });

      item.on('done', (event: Electron.Event, state: string) => {
        ipcMain.removeAllListeners('pause-downloads-progress');
        ipcMain.removeAllListeners('resume-downloads-progress');
        ipcMain.removeAllListeners('cancel-downloads-progress');
        mainWindow.webContents.send('complete-downloads-progress', {
          name: item.getFilename(),
          startTime: item.getStartTime(),
          dataState: state,
        });
      });
    }
  });
};

const setPermissionRequestHandler = (mainWindow: Electron.BrowserWindow): void => {
  const sess = session.defaultSession as Electron.Session;
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
};

export default {
  registerWebRequestListeners,
  registerScheme,
  registerCertificateVerifyProc,
  onWillDownload,
  setPermissionRequestHandler,
};
