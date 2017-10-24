/* eslint-disable no-underscore-dangle */

const { ipcRenderer, remote, webFrame } = require('electron');
const { runInThisContext } = require('vm');
const { LocalStorage } = require('node-localstorage');

webFrame.registerURLSchemeAsPrivileged('lulumi-extension');

let guestInstanceId = -1;
const guestInstanceIndex = process.argv.findIndex(e => e.indexOf('--guest-instance-id=') !== -1);
if (guestInstanceIndex !== -1) {
  guestInstanceId = parseInt(
    process.argv[guestInstanceIndex].substr(
      process.argv[guestInstanceIndex].indexOf('=') + 1));
}

// Check whether pattern matches.
// https://developer.chrome.com/extensions/match_patterns
const matchesPattern = (pattern) => {
  if (pattern === '<all_urls>') {
    return true;
  }

  const regexp = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  const url = `${location.protocol}//${location.host}${location.pathname}`;
  return url.match(regexp);
};

// Run the code with chrome and lulumi API integrated.
const runContentScript = (extensionId, url, code) => {
  const context = {};
  global.scriptType = 'content-script';
  require('../api/inject-to').injectTo(guestInstanceId, extensionId, global.scriptType, context, LocalStorage);
  const wrapper = `((lulumi) => {
    var chrome = lulumi;
    ${code}
  });`;
  const compiledWrapper = runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true,
  });
  return compiledWrapper.call(this, context.lulumi);
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
        process.once('document-start', fire);
      } else if (script.runAt === 'document_end') {
        process.once('document-end', fire);
      } else {
        document.addEventListener('DOMContentLoaded', fire);
      }
    });
  }

  if (script.css) {
    script.css.forEach((css) => {
      const fire = runStylesheet.bind(window, css.url, css.code);
      if (script.runAt === 'document_start') {
        process.once('document-start', fire);
      } else if (script.runAt === 'document_end') {
        process.once('document-end', fire);
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
    if (pref.contentScripts) {
      pref.contentScripts.forEach(script => injectContentScript(pref.extensionId, script));
    }
  });
}

const requireTmp = require;
const moduleTmp = module;
const __dirnameTmp = __dirname;

// about:newtab handler
process.once('document-start', () => {
  if (document.location.href === 'lulumi://about/#/newtab') {
    ipcRenderer.once('newtab', (event, newtab) => (document.location.href = newtab));
    ipcRenderer.sendToHost('newtab');
  }
});

process.once('loaded', () => {
  if (process.env.TEST_ENV === 'e2e') {
    global.require = requireTmp;
  }

  if (document.location.href.startsWith('lulumi://')) {
    ipcRenderer.send('lulumi-scheme-loaded', document.location.href);

    global.about = remote.getGlobal('guestData');
    global.backgroundPages = remote.getGlobal('backgroundPages');
    global.manifestMap = remote.getGlobal('manifestMap');
    global.renderProcessPreferences = remote.getGlobal('renderProcessPreferences');

    global.require = requireTmp;
    global.module = moduleTmp;
  }

  global.ipcRenderer = ipcRenderer;

  ipcRenderer.on('lulumi-tabs-send-message', (event, message) => {
    ipcRenderer.send('lulumi-runtime-emit-on-message', message);
  });
});
