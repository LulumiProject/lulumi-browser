const { ipcRenderer, remote } = require('electron');
const { runInThisContext } = require('vm');

// Check whether pattern matches.
// https://developer.chrome.com/extensions/match_patterns
const matchesPattern = function (pattern) {
  if (pattern === '<all_urls>') {
    return true;
  }

  const regexp = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return location.href.match(regexp);
}

const injectTo = function (extensionId, isBackgroundPage, context) {
  const lulumi = context.lulumi = context.lulumi || {};
};

// Run the code with lulumi API integrated.
const runContentScript = function (extensionId, url, code) {
  const context = {};
  injectTo(extensionId, false, context);
  const wrapper = `(function (lulumi) {\n  ${code}\n})`;
  const compiledWrapper = runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true
  });
  return compiledWrapper.call(this, context.lulumi);
};

// Run the code with lulumi API integrated.
const runStylesheet = function (extensionId, url, code) {
  const wrapper = `(function () {\n
    function init() {
      var styleElement = document.createElement('style');
      styleElement.setAttribute('type', 'text/css');
      styleElement.textContent = \`${code}\`;
      document.querySelector('head').append(styleElement);
    }
    document.addEventListener('DOMContentLoaded', init);\n})`;
    const compiledWrapper = runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true
  });
  return compiledWrapper.call(this);
};

// run injected scripts
// https://developer.chrome.com/extensions/content_scripts
const injectContentScript = function (extensionId, script) {
  for (const match of script.matches) {
    
    if (!matchesPattern(match)) {
      return;
    }
  }

  for (const {url, code} of script.js) {
    const fire = runContentScript.bind(window, extensionId, url, code);
    if (script.runAt === 'document_start') {
      process.once('document-start', fire);
    } else if (script.runAt === 'document_end') {
      process.once('document-end', fire);
    } else if (script.runAt === 'document_idle') {
      document.addEventListener('DOMContentLoaded', fire);
    }
  }
  for (const {url, code} of script.css) {
    const fire = runStylesheet.bind(window, extensionId, url, code);
    if (script.runAt === 'document_start') {
      process.once('document-start', fire);
    } else if (script.runAt === 'document_end') {
      process.once('document-end', fire);
    } else if (script.runAt === 'document_idle') {
      document.addEventListener('DOMContentLoaded', fire);
    }
  }
};

// read the renderer process preferences to see if we need to inject scripts
const preferences = remote.getGlobal('renderProcessPreferences');
if (preferences) {
  for (const pref of preferences) {
    if (pref.contentScripts) {
      for (const script of pref.contentScripts) {
        injectContentScript(pref.extensionId, script);
      }
    }
  }
}

const requireTmp = require;
const moduleTmp = module;

process.once('loaded', () => {
  if (document.location.href.startsWith('lulumi://')) {
    ipcRenderer.send('lulumi-scheme-loaded', document.location.href);
    global.data = remote.getGlobal('sharedObject').guestData;

    global.require = requireTmp;
    global.module = moduleTmp;
    global.ipcRenderer = ipcRenderer;
  }
});
