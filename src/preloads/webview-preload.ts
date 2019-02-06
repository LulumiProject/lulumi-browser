import { ipcRenderer, remote, webFrame } from 'electron';
import * as urllib from 'url';
import { runInThisContext } from 'vm';

import requirePreload from './require-preload';
import injectTo from '../renderer/api/inject-to';

/* tslint:disable:align */
/* tslint:disable:max-line-length */
/* tslint:disable:function-name */

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.includes('--guest-instance-id='));
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1), 10);
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
    webFrame.setIsolatedWorldHumanReadableName(isolatedWorldId, name);
    webFrame.executeJavaScriptInIsolatedWorld(isolatedWorldId, [{
      code: 'window',
    }], false, (window) => {
      window.chrome = window.lulumi = context.lulumi;
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
  const wrapper = `((code) => {
    function init() {
      const styleElement = document.createElement('style');
      styleElement.textContent = code;
      document.head.append(styleElement);
    }
    document.addEventListener('DOMContentLoaded', init);
  })`;
  const compiledWrapper = runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true,
  });
  return compiledWrapper.call(this, code);
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
const preferences = remote.getGlobal('renderProcessPreferences');
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
    if (document.location.href === 'about:newtab') {
      document.location.href = 'lulumi://about/#/newtab';
    } else if (document.location.href.startsWith('lulumi://')) {
      ipcRenderer.send('lulumi-scheme-loaded', document.location.href);

      webFrame.executeJavaScript('window', ((window) => {
        window.about = remote.getGlobal('guestData');
        window.backgroundPages = remote.getGlobal('backgroundPages');
        window.manifestMap = remote.getGlobal('manifestMap');
        window.renderProcessPreferences = remote.getGlobal('renderProcessPreferences');
        window.createFromPath = remote.nativeImage.createFromPath;
        window.join = require('path').join;

        window.ipcRenderer = ipcRenderer;
        window.require = requirePreload.require;
        window.module = moduleTmp;
      }) as any);
    }
    if (process.env.NODE_ENV === 'test'
      && process.env.TEST_ENV === 'e2e') {
      webFrame.executeJavaScript('window', ((window) => {
        window.require = requirePreload.electronRequire;
      }) as any);
    }
  }
  ipcRenderer.on('lulumi-tabs-send-message', (event: Electron.IpcMessageEvent, message) => {
    ipcRenderer.send('lulumi-runtime-emit-on-message', message);
  });
  ipcRenderer.on('remove-lulumi-extension-result', (event: Electron.IpcMessageEvent, data): void => {
    if (data.result === 'OK') {
      delete isolatedWorldMaps[data.extensionId];
    }
  });
});
