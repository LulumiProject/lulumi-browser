import { ipcRenderer, remote, webFrame } from 'electron';
import { runInThisContext } from 'vm';

import requirePreload from './require-preload';
import injectTo from '../renderer/api/inject-to';

/* tslint:disable:align */
/* tslint:disable:max-line-length */
/* tslint:disable:function-name */

const { LocalStorage } = require('node-localstorage');

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.indexOf('--guest-instance-id=') !== -1);
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

// Run the code with chrome and lulumi API integrated.
const runContentScript = (extensionId, url, code) => {
  const context: any = {};
  globalObject.scriptType = 'content-script';
  injectTo(guestInstanceId, extensionId, globalObject.scriptType, context, LocalStorage);
  const wrapper = `((lulumi) => {
    var chrome = lulumi;
    ${code}
  });`;
  webFrame.executeJavaScriptInIsolatedWorld(1, [
    {
      url,
      code: wrapper,
    },
  ]);
  webFrame.setIsolatedWorldHumanReadableName(1, extensionId);
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
const injectContentScript = (extensionId, script) => {
  if (!script.matches.some(matchesPattern)) {
    return;
  }

  // process will listen on multiple document_* events
  // if we have multiple extensions
  process.setMaxListeners(0);
  if (script.js) {
    script.js.forEach((js) => {
      const fire = runContentScript.bind(window, extensionId, js.url, js.code);
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
  preferences.forEach((pref) => {
    if (pref.content_scripts) {
      pref.content_scripts.forEach(script => injectContentScript(pref.extensionId, script));
    }
  });
}

const moduleTmp = module;

process.once('loaded', () => {
  if (process.env.TEST_ENV === 'e2e') {
    globalObject.require = requirePreload;
  }
  if (document.location.href.startsWith('lulumi://')) {
    // about:newtab handler
    if (document.location.href === 'lulumi://about/#/newtab') {
      setTimeout(() => {
        ipcRenderer.once('newtab', (event, newtab) => (document.location.href = newtab));
        ipcRenderer.sendToHost('newtab');
      });

      global.console.warn = function () { };
    } else {
      ipcRenderer.send('lulumi-scheme-loaded', document.location.href);

      globalObject.about = remote.getGlobal('guestData');
      globalObject.backgroundPages = remote.getGlobal('backgroundPages');
      globalObject.manifestMap = remote.getGlobal('manifestMap');
      globalObject.renderProcessPreferences = remote.getGlobal('renderProcessPreferences');
      globalObject.createFromPath = remote.nativeImage.createFromPath;
      globalObject.join = require('path').join;
    }
    globalObject.ipcRenderer = ipcRenderer;
    globalObject.require = requirePreload;
    globalObject.module = moduleTmp;
  } else {
    webFrame.executeJavaScript('window.eval = function () { };');
  }
  ipcRenderer.on('lulumi-tabs-send-message', (event, message) => {
    ipcRenderer.send('lulumi-runtime-emit-on-message', message);
  });
});
