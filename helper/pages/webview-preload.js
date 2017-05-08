const { ipcRenderer, remote } = require('electron');
const { runInThisContext } = require('vm');
const { LocalStorage } = require('node-localstorage');
const stripCssComments = require('strip-css-comments');

// Check whether pattern matches.
// https://developer.chrome.com/extensions/match_patterns
const matchesPattern = (pattern) => {
  if (pattern === '<all_urls>') {
    return true;
  }

  const regexp = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  return location.href.match(regexp);
};

// Run the code with lulumi API integrated.
const runContentScript = (extensionId, url, code) => {
  const context = {};
  require('./inject-to').injectTo(extensionId, false, context, LocalStorage);
  global.lulumi = context.lulumi;
  const wrapper = `\n
    var chrome = lulumi;
    ${code}
    \n`;
  runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true,
  });
  // TODO: `this` show be global.window due to L#67, but it's not. Wired!
  // return compiledWrapper.call(window, context.lulumi);
};

// Run the code with lulumi API integrated.
const runStylesheet = (extensionId, url, code) => {
  const wrapper = `(function () {\n
    function init() {
      var styleElement = document.createElement('style');
      styleElement.setAttribute('type', 'text/css');
      styleElement.textContent = \`${stripCssComments(code, { preserve: false })}\`;
      document.querySelector('head').append(styleElement);
    }
    document.addEventListener('DOMContentLoaded', init);\n})`;
  const compiledWrapper = runInThisContext(wrapper, {
    filename: url,
    lineOffset: 1,
    displayErrors: true,
  });
  return compiledWrapper.call(this);
};

// run injected scripts
// https://developer.chrome.com/extensions/content_scripts
const injectContentScript = (extensionId, script) => {
  let flag = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const match of script.matches) {
    if (matchesPattern(match)) {
      flag = false;
      break;
    }
    flag = true;
  }

  if (flag) {
    return;
  }

  // process will listen on multiple document_* events
  // if we have multiple extensions
  process.setMaxListeners(0);
  if (script.js !== undefined) {
    script.js.forEach((js) => {
      const fire = runContentScript.bind(window, extensionId, js.url, js.code);
      if (script.runAt === 'document_start') {
        process.once('document-start', fire);
      } else if (script.runAt === 'document_end') {
        process.once('document-end', fire);
      } else if (script.runAt === 'document_idle') {
        document.addEventListener('DOMContentLoaded', fire);
      }
    });
  }

  if (script.css !== undefined) {
    script.css.forEach((css) => {
      const fire = runStylesheet.bind(window, extensionId, css.url, css.code);
      if (script.runAt === 'document_start') {
        process.once('document-start', fire);
      } else if (script.runAt === 'document_end') {
        process.once('document-end', fire);
      } else if (script.runAt === 'document_idle') {
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

process.once('loaded', () => {
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
