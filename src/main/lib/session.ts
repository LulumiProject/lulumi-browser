import { BrowserWindow, ipcMain, session } from 'electron';
import * as forge from 'node-forge';
import generate from 'nanoid/generate';

import mainStore from '../../shared/store/mainStore';

/* tslint:disable:max-line-length */
/* tslint:disable:no-console */
/* tslint:disable:object-shorthand-properties-first */
/* tslint:disable:align */

ipcMain.setMaxListeners(0);

const generateRequestId = () => generate('1234567890', 32);

const register = (eventName: any, sess: Electron.Session, eventLispCaseName: string, id: number, digest: string, filter): void => {
  if ((eventName === 'onBeforeRequest') || (eventName === 'onBeforeSendHeaders')) {
    sess.webRequest[eventName](filter, (details, callback) => {
      const requestId = generateRequestId();
      if (details.resourceType === 'mainFrame') {
        details.type = 'main_frame';
      } else if (details.resourceType === 'subFrame') {
        details.type = 'sub_frame';
      } else if (details.resourceType === 'xhr') {
        details.type = 'xmlhttprequest';
      } else if (details.resourceType === 'cspReport') {
        details.type = 'csp_report';
      } else {
        details.type = details.resourceType;
      }
      if (details.requestHeaders) {
        const requestHeaders: object[] = [];
        Object.keys(details.requestHeaders).forEach((k) => {
          requestHeaders.push({ name: k, value: details.requestHeaders[k] });
        });
        details.requestHeaders = requestHeaders;
      }
      ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response-${digest}-${requestId}`, (event: Electron.Event, request) => {
        if (request) {
          if (request.cancel) {
            callback({ cancel: true });
          } else if (request.requestHeaders) {
            const requestHeaders: object = {};
            request.requestHeaders.forEach((requestHeader) => {
              requestHeaders[requestHeader.name] = requestHeader.value;
            });
            callback({ requestHeaders, cancel: false });
          } else if (request.redirectUrl) {
            callback({ redirectURL: request.redirectUrl, cancel: false });
          }
        } else {
          callback({ cancel: false });
        }
      });
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.send('lulumi-web-request-intercepted', {
        eventLispCaseName,
        digest,
        requestId,
        details,
        webContentsId: id,
      });
    });
  } else if (eventName === 'onHeadersReceived') {
    sess.webRequest[eventName](filter, (details, callback) => {
      const requestId = generateRequestId();
      if (details.resourceType === 'mainFrame') {
        details.type = 'main_frame';
      } else if (details.resourceType === 'subFrame') {
        details.type = 'sub_frame';
      } else if (details.resourceType === 'xhr') {
        details.type = 'xmlhttprequest';
      } else if (details.resourceType === 'cspReport') {
        details.type = 'csp_report';
      } else {
        details.type = details.resourceType;
      }
      if (details.responseHeaders) {
        const responseHeaders: object[] = [];
        Object.keys(details.responseHeaders).forEach((k) => {
          responseHeaders.push({ name: k, value: details.responseHeaders[k][0] });
        });
        details.responseHeaders = responseHeaders;
      }

      ipcMain.once(`lulumi-web-request-${eventLispCaseName}-response-${digest}-${requestId}`, (event: Electron.Event, response) => {
        if (response) {
          if (response.cancel) {
            callback({ cancel: true });
          } else if (response.responseHeaders) {
            const responseHeaders: object = {};
            response.responseHeaders.forEach((responseHeader) => {
              responseHeaders[responseHeader.name] = responseHeader.value;
            });
            if (response.statusLine) {
              callback({ responseHeaders, statusLine: response.statusLine, cancel: false });
            } else {
              callback({ responseHeaders, statusLine: details.statusLine, cancel: false });
            }
          }
        } else {
          callback({ cancel: false });
        }
      });
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.send('lulumi-web-request-intercepted', {
        eventLispCaseName,
        digest,
        requestId,
        details,
        webContentsId: id,
      });
    });
  } else {
    sess.webRequest[eventName](filter, (details) => {
      if (details.resourceType === 'mainFrame') {
        details.type = 'main_frame';
      } else if (details.resourceType === 'subFrame') {
        details.type = 'sub_frame';
      } else if (details.resourceType === 'xhr') {
        details.type = 'xmlhttprequest';
      } else if (details.resourceType === 'cspReport') {
        details.type = 'csp_report';
      } else {
        details.type = details.resourceType;
      }
      if (details.requestHeaders) {
        const requestHeaders: object[] = [];
        Object.keys(details.requestHeaders).forEach((k) => {
          requestHeaders.push({ name: k, value: details.requestHeaders[k] });
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
        requestId: 0,
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
  const sess = session.fromPartition('persist:webview') as Electron.Session;
  ipcMain.on('lulumi-web-request-add-listener-on-before-request', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRequest', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-request', (event, extensionName, eventLispCaseName): void => {
    unregister('onBeforeRequest', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-send-headers', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeSendHeaders', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-send-headers', (event, extensionName, eventLispCaseName): void => {
    unregister('onBeforeSendHeaders', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-send-headers', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onSendHeaders', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-send-headers', (event, extensionName, eventLispCaseName): void => {
    unregister('onSendHeaders', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-headers-received', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onHeadersReceived', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-headers-received', (event, extensionName, eventLispCaseName): void => {
    unregister('onHeadersReceived', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-response-started', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onResponseStarted', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-response-started', (event, extensionName, eventLispCaseName): void => {
    unregister('onResponseStarted', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-before-redirect', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onBeforeRedirect', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-before-redirect', (event, extensionName, eventLispCaseName): void => {
    unregister('onBeforeRedirect', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-completed', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onCompleted', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-completed', (event, extensionName, eventLispCaseName): void => {
    unregister('onCompleted', sess);
  });
  ipcMain.on('lulumi-web-request-add-listener-on-error-occurred', (event: Electron.IpcMainEvent, extensionName, eventLispCaseName: string, digest: string, filter): void => {
    register('onErrorOccurred', sess, eventLispCaseName, event.sender.id, digest, filter);
  });
  ipcMain.on('lulumi-web-request-remove-listener-on-error-occurred', (event, extensionName, eventLispCaseName): void => {
    unregister('onErrorOccurred', sess);
  });
};

const registerScheme = (scheme: string): void => {
  let sess: Electron.Session | null = null;
  if (scheme === 'lulumi') {
    sess = session.fromPartition('persist:webview');
  } else {
    sess = session.fromPartition('command-palette');
  }
  if (process.env.NODE_ENV === 'development') {
    sess.protocol.registerHttpProtocol(scheme, async (request, callback) => {
      const url: string = request.url.substr(`${scheme}://`.length);
      const [type, ...param] = url.split('/');
      if (param[0].indexOf('#') === 0) {
        callback({
          method: request.method,
          url: `http://localhost:${require('../../../.electron-vue/config').port}/${type}.html`,
        });
      } else {
        callback({
          method: request.method,
          url: `http://localhost:${require('../../../.electron-vue/config').port}/${param.join('/')}`,
        });
      }
    }, (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    });
  } else {
    sess.protocol.registerFileProtocol(scheme, (request, callback) => {
      const url: string = request.url.substr(`${scheme}://`.length);
      const [type, ...param] = url.split('/');
      if (param.indexOf('#') === 0) {
        callback(`${__dirname}/${type}.html`);
      } else {
        callback(`${__dirname}/${param.join('/')}`);
      }
    }, (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    });
  }
};

const registerCertificateVerifyProc = () => {
  const sess = session.fromPartition('persist:webview') as Electron.Session;
  const store = mainStore.getStore();
  sess.setCertificateVerifyProc((request, callback) => {
    try {
      const cert = forge.pki.certificateFromPem(request.certificate.data);
      store.dispatch('updateCertificate', {
        hostname: cert.subject.getField('CN').value,
        certificate: request.certificate,
        verificationResult: request.verificationResult,
        errorCode: request.errorCode,
      });
      if (cert.getExtension('subjectAltName').altNames.length > 0) {
        cert.getExtension('subjectAltName').altNames.forEach((altName) => {
          store.dispatch('updateCertificate', {
            hostname: altName.value,
            certificate: request.certificate,
            verificationResult: request.verificationResult,
            errorCode: request.errorCode,
          });
        });
      }
    } catch (err) {
      if (err.toString() === 'Error: Cannot read public key. OID is not RSA.') {
        console.error('(lulumi-browser) `node-forge` doesn\'t support ECC for now, so we fallback to the old method.');
        store.dispatch('updateCertificate', {
          hostname: request.hostname,
          certificate: request.certificate,
          verificationResult: request.verificationResult,
          errorCode: request.errorCode,
        });
      } else {
        console.error(`(node-forge) ${err}`);
      }
    }

    if (request.verificationResult !== 'net::OK') {
      callback(-3);
    } else {
      callback(0);
    }
  });
};

const onWillDownload = (windows, path: string): void => {
  const sess = session.fromPartition('persist:webview') as Electron.Session;
  sess.on('will-download', (event, item, webContents) => {
    const itemURL = item.getURL();
    if (item.getMimeType() === 'application/pdf'
      && itemURL.indexOf('blob:') !== 0
      && !itemURL.includes('#pdfjs.action=download')
      && !itemURL.includes('skip=true')) {
      event.preventDefault();
      const qs = require('querystring');
      const param = qs.stringify({ file: itemURL });
      const pdfViewerURL = `file://${path}/web/viewer.html`;
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('open-pdf', {
          url: `${pdfViewerURL}?${param}`,
          webContentsId: webContents.id,
        });
      });
    } else {
      const totalBytes = item.getTotalBytes();
      const startTime = item.getStartTime();
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('will-download-any-file', {
          totalBytes,
          startTime,
          webContentsId: webContents.id,
          name: item.getFilename(),
          url: item.getURL(),
          isPaused: item.isPaused(),
          canResume: item.canResume(),
          dataState: 'init',
        });
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
        Object.keys(windows).forEach((key) => {
          const id = parseInt(key, 10);
          const window = windows[id];
          window.webContents.send('update-downloads-progress', {
            hostWebContentsId: webContents.hostWebContents.id,
            startTime: item.getStartTime(),
            getReceivedBytes: item.getReceivedBytes(),
            savePath: item.getSavePath(),
            isPaused: item.isPaused(),
            canResume: item.canResume(),
            dataState: state,
          });
        });
      });

      item.on('done', (event: Electron.Event, state: string) => {
        ipcMain.removeAllListeners('pause-downloads-progress');
        ipcMain.removeAllListeners('resume-downloads-progress');
        ipcMain.removeAllListeners('cancel-downloads-progress');
        Object.keys(windows).forEach((key) => {
          const id = parseInt(key, 10);
          const window = windows[id];
          window.webContents.send('complete-downloads-progress', {
            hostWebContentsId: webContents.hostWebContents.id,
            name: item.getFilename(),
            startTime: item.getStartTime(),
            dataState: state,
          });
        });
      });
    }
  });
};

const setPermissionRequestHandler = (windows): void => {
  const sess = session.fromPartition('persist:webview') as Electron.Session;
  sess.setPermissionRequestHandler((webContents, permission, callback) => {
    Object.keys(windows).forEach((key) => {
      const id = parseInt(key, 10);
      const window = windows[id];
      window.webContents.send('request-permission', {
        permission,
        webContentsId: webContents.id,
      });
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

const registerProxy = (proxyConfig: Electron.Config): void => {
  const sess = session.fromPartition('persist:webview') as Electron.Session;
  sess.setProxy(proxyConfig, () => { });
};

export default {
  registerWebRequestListeners,
  registerScheme,
  registerCertificateVerifyProc,
  onWillDownload,
  setPermissionRequestHandler,
  registerProxy,
};
