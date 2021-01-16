/* eslint-disable max-len */

import { contextBridge, ipcRenderer, remote, webFrame } from 'electron';
import * as urllib from 'url';

import requirePreload from './require-preload';
import injectTo from '../renderer/api/inject-to';

declare const location;
let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.includes('--guest-instance-id='));
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1
    ),
    10,
  );
}

// Check whether pattern matches.
// https://developer.chrome.com/extensions/match_patterns
const matchesPattern = (pattern) => {
  if (pattern === '<all_urls>') {
    return true;
  }

  const regexp = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  const url = `${location.protocol}//${location.host}${location.pathname}`;
  return url.match(regexp);
};

const globalObject = global as any;
const isolatedWorldMaps: Lulumi.Preload.IsolatedWorldMaps = {};
const context: Lulumi.Preload.Context = { lulumi: {} };

// Run the code with chrome and lulumi API integrated.
const runContentScript = (name, extensionId, isolatedWorldId, url, code) => {
  const parsed = urllib.parse(url);
  const extension = isolatedWorldMaps[extensionId];
  globalObject.scriptType = 'content-script';
  if (extension === undefined) {
    isolatedWorldMaps[extensionId] = isolatedWorldId;
    injectTo(guestInstanceId, extensionId, globalObject.scriptType, context);
    webFrame.setIsolatedWorldInfo(isolatedWorldId, {
      name,
      securityOrigin: origin,
    });
    webFrame.executeJavaScriptInIsolatedWorld(isolatedWorldId, [{
      code: 'window',
    }], false).then((window) => {
      window.lulumi = context.lulumi;
      window.chrome = window.lulumi;
    });
  }
  webFrame.executeJavaScriptInIsolatedWorld(isolatedWorldId, [{
    code,
    url: urllib.format({
      protocol: parsed.protocol,
      slashes: true,
      hostname: extensionId,
      pathname: parsed.pathname,
    }),
  }]);
};

const runStylesheet = (url, code) => {
  webFrame.insertCSS(code);
};

// run injected scripts
// https://developer.chrome.com/extensions/content_scripts
const injectContentScript = (name, extensionId, script, isolatedWorldId) => {
  if (!script.matches.some(matchesPattern)) {
    return;
  }

  // process will listen on multiple document_* events
  // if we have multiple extensions
  process.setMaxListeners(0);
  if (script.js) {
    script.js.forEach((js) => {
      const fire = runContentScript.bind(window, name, extensionId, isolatedWorldId, js.url, js.code);
      if (script.runAt === 'document_start') {
        process.once(('document-start' as any), fire);
      } else if (script.runAt === 'document_end') {
        process.once(('document-end' as any), fire);
      } else {
        document.addEventListener('DOMContentLoaded', fire);
      }
    });
  }

  if (script.css) {
    script.css.forEach((css) => {
      const fire = runStylesheet.bind(window, css.url, css.code);
      if (script.runAt === 'document_start') {
        process.once(('document-start' as any), fire);
      } else if (script.runAt === 'document_end') {
        process.once(('document-end' as any), fire);
      } else {
        document.addEventListener('DOMContentLoaded', fire);
      }
    });
  }
};

// read the renderer process preferences to see if we need to inject scripts
const preferences = ipcRenderer.sendSync('get-render-process-preferences');
if (preferences) {
  let nextIsolatedWorldId = 999;
  preferences.forEach((pref) => {
    if (pref.content_scripts) {
      nextIsolatedWorldId -= 1;
      pref.content_scripts.forEach((script) => {
        injectContentScript(pref.name, pref.extensionId, script, nextIsolatedWorldId);
      });
    }
  });
}

const moduleTmp = module;

process.once('loaded', () => {
  if (document.location) {
    if (document.location.href.startsWith('lulumi://') ||
      (process.env.NODE_ENV === 'development' && document.location.href.startsWith('http://localhost:'))) {
      contextBridge.exposeInMainWorld('data', {
        about: ipcRenderer.sendSync('lulumi-scheme-loaded', document.location.href),
        backgroundPages: ipcRenderer.sendSync('get-background-pages'),
        manifestMap: ipcRenderer.sendSync('get-manifest-map'),
        renderProcessPreferences: ipcRenderer.sendSync('get-render-process-preferences'),
      });
      contextBridge.exposeInMainWorld('func', {
        createFromPath: remote.nativeImage.createFromPath,
        join: require('path').join,
        module: moduleTmp,
      });
      webFrame.executeJavaScript('window').then((window) => {
        window.require = requirePreload.require;
        window.ipcRenderer = ipcRenderer;
        // eslint-disable-next-line no-console
      }).catch(err => console.error(err));
    }
    if (process.env.NODE_ENV === 'test' &&
      process.env.TEST_ENV === 'e2e') {
      webFrame.executeJavaScript('window').then((window) => {
        window.require = requirePreload.electronRequire;
        // eslint-disable-next-line no-console
      }).catch(err => console.error(err));
    }
  }
  ipcRenderer.on('lulumi-tabs-send-message', (event, message) => {
    ipcRenderer.send('lulumi-runtime-emit-on-message', message);
  });
  ipcRenderer.on('remove-lulumi-extension-result', (event, data): void => {
    if (data.result === 'OK') {
      delete isolatedWorldMaps[data.extensionId];
    }
  });
});
