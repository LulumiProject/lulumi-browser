import { app, webContents } from 'electron';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import url from 'url';

const objectValues = (object) => {
  return Object.keys(object).map(function (key) { return object[key] });
};

global.renderProcessPreferences = [];
// extensionId => manifest
const manifestMap = {};
// name => manifest
const manifestNameMap = {};

const generateExtensionIdFromName = (name) => {
  return name.replace(/[\W_]+/g, '-').toLowerCase();
};

const isWindowOrWebView = (webContents) => {
  const type = webContents.getType();
  return type === 'window' || type === 'webview';
};

// Create or get manifest object from |srcDirectory|.
const getManifestFromPath = (srcDirectory) => {
  let manifest;
  let manifestContent;

  try {
    manifestContent = fs.readFileSync(path.join(srcDirectory, 'manifest.json'));
  } catch (readError) {
    console.warn(`Reading ${path.join(srcDirectory, 'manifest.json')} failed.`);
    console.warn(readError.stack || readError);
    throw readError;
  }

  try {
    manifest = JSON.parse(manifestContent);
  } catch (parseError) {
    console.warn(`Parsing ${path.join(srcDirectory, 'manifest.json')} failed.`);
    console.warn(parseError.stack || parseError);
    throw parseError;
  }

  if (!manifestNameMap[manifest.name]) {
    const extensionId = generateExtensionIdFromName(manifest.name);
    manifestMap[extensionId] = manifestNameMap[manifest.name] = manifest;
    Object.assign(manifest, {
      srcDirectory: srcDirectory,
      extensionId: extensionId,
      // We can not use 'file://' directly because all resources in the extension
      // will be treated as relative to the root in Chrome.
      startPage: url.format({
        protocol: 'chrome-extension',
        slashes: true,
        hostname: extensionId,
        pathname: manifest.devtools_page
      })
    })
    return manifest;
  } else if (manifest && manifest.name) {
    console.warn(`Attempted to load extension "${manifest.name}" that has already been loaded.`);
  }
};

// manage the background pages
const backgroundPages = {};

const startBackgroundPages = (manifest) => {
  if (backgroundPages[manifest.extensionId] || !manifest.background) {
    return;
  }

  let html;
  let name;
  if (manifest.background.page) {
    name = manifest.background.page;
    html = fs.readFileSync(path.join(manifest.srcDirectory, manifest.background.page));
  } else {
    name = '_generated_background_page.html'
    const scripts = manifest.background.scripts.map((name) => {
      return `<script src="${name}"></script>`
    }).join('');
    html = new Buffer(`<html><body>${scripts}</body></html>`);
  }

  const contents = webContents.create({
    partition: 'persist:__chrome_extension',
    isBackgroundPage: true,
    commandLineSwitches: ['--background-page'],
  });
  backgroundPages[manifest.extensionId] = { html, webContents: contents, name };
  contents.loadURL(url.format({
    protocol: 'lulumi-extension',
    slashes: true,
    hostname: manifest.extensionId,
    pathname: name,
  }));
};

const removeBackgroundPages = (manifest) => {
  if (!backgroundPages[manifest.extensionId]) {
    return;
  }

  backgroundPages[manifest.extensionId].webContents.destroy();
  delete backgroundPages[manifest.extensionId];
};

const sendToBackgroundPages = (...args) => {
  for (const page of objectValues(backgroundPages)) {
    page.webContents.sendToAll(...args);
  }
};

// Dispatch web contents events to Chrome APIs
const hookWebContentsEvents = (webContents) => {
  const tabId = webContents.id;

  sendToBackgroundPages('CHROME_TABS_ONCREATED');

  webContents.on('will-navigate', (event, url) => {
    sendToBackgroundPages('CHROME_WEBNAVIGATION_ONBEFORENAVIGATE', {
      frameId: 0,
      parentFrameId: -1,
      processId: webContents.getProcessId(),
      tabId,
      timeStamp: Date.now(),
      url,
    });
  });

  webContents.on('did-navigate', (event, url) => {
    sendToBackgroundPages('CHROME_WEBNAVIGATION_ONCOMPLETED', {
      frameId: 0,
      parentFrameId: -1,
      processId: webContents.getProcessId(),
      tabId,
      timeStamp: Date.now(),
      url,
    });
  });

  webContents.once('destroyed', () => {
    sendToBackgroundPages('CHROME_TABS_ONREMOVED', tabId);
  });
};

// handle the lulumi.* API messages
let nextId = 0;

// transfer the content scripts to renderer
const contentScripts = {};

const injectContentScripts = (manifest) => {
  if (contentScripts[manifest.name] || !manifest.content_scripts) {
    return;
  }

  const readArrayOfFiles = (relativePath) => {
    return {
      url: `lulumi-extension://${manifest.extensionId}/${relativePath}`,
      code: String(fs.readFileSync(path.join(manifest.srcDirectory, relativePath))),
    };
  };

  const contentScriptToEntry = (script) => {
    return {
      matches: script.matches,
      js: script.js.map(readArrayOfFiles),
      css: script.css.map(readArrayOfFiles),
      runAt: script.run_at || 'document_idle',
    };
  };

  try {
    const entry = {
      extensionId: manifest.extensionId,
      contentScripts: manifest.content_scripts.map(contentScriptToEntry),
    };
    global.renderProcessPreferences.push(entry);
    contentScripts[manifest.name] = entry;
  } catch (e) {
    console.error('Failed to read content scripts', e);
  }
};

const removeContentScripts = (manifest) => {
  if (!contentScripts[manifest.name]) {
    return;
  }

  global.renderProcessPreferences = global.renderProcessPreferences.filter((el) => el.extensionId !== contentScripts[manifest.name].extensionId);
  delete contentScripts[manifest.name];
}

// Transfer the |manifest| to a format that can be recognized by the
// |DevToolsAPI.addExtensions|.
const manifestToExtensionInfo = (manifest) => {
  return {
    startPage: manifest.startPage,
    srcDirectory: manifest.srcDirectory,
    name: manifest.name,
    exposeExperimentalAPIs: true,
  };
};

// load the extensions for the window
const loadExtension = (manifest) => {
  startBackgroundPages(manifest);
  injectContentScripts(manifest);
};

const loadLulumiExtensions = (win, manifests) => {
  if (!win.devToolsWebContents) {
    return;
  }

  manifests.forEach(loadExtension);

  const extensionInfoArray = manifests.map(manifestToExtensionInfo);
  // win.devToolsWebContents.executeJavaScript(`DevToolsAPI.addExtensions(${JSON.stringify(extensionInfoArray)})`);
};

app.on('web-contents-created', (event, webContents) => {
  if (!isWindowOrWebView(webContents)) {
    return;
  }

  hookWebContentsEvents(webContents);
  webContents.on('dom-ready', () => {
    loadLulumiExtensions(webContents, objectValues(manifestMap));
  });
});

// the lulumi-extension can map a extension URL request to real file path
const lulumiExtensionHandler = (request, callback) => {
  const parsed = url.parse(request.url);
  if (!parsed.hostname || !parsed.path) {
    return callback();
  }

  const manifest = manifestMap[parsed.hostname];
  if (!manifest) {
    return callback();
  }

  const page = backgroundPages[parsed.hostname];
  if (page && parsed.path === `/${page.name}`) {
    return callback({
      mimeType: 'text/html',
      data: page.html,
    });
  }

  fs.readFile(path.join(manifest.srcDirectory, parsed.path), (err, content) => {
    if (err) {
      return callback(-6);  // FILE_NOT_FOUND
    } else {
      return callback(content);
    }
  });
};

app.on('session-created', (sess) => {
  sess.protocol.registerBufferProtocol('lulumi-extension', lulumiExtensionHandler, (error) => {
    if (error) {
      console.error(`Unable to register lulumi-extension protocol: ${error}`);
    }
  });
});

// the persistent path of "Lulumi Extensions" preference file
let loadedExtensionsPath = null;

/*
app.on('will-quit', () => {
  try {
    const loadedExtensions = objectValues(manifestMap).map((manifest) => {
      return manifest.srcDirectory;
    });
    if (loadedExtensions.length > 0) {
      try {
        fs.mkdirSync(path.dirname(loadedExtensionsPath));
      } catch (error) {
        // Ignore error
      }
      fs.writeFileSync(loadedExtensionsPath, JSON.stringify(loadedExtensions));
    } else {
      fs.unlinkSync(loadedExtensionsPath);
    }
  } catch (error) {
    // Ignore error
  }
});
*/

// we can not use protocol or BrowserWindow until app is ready
app.once('ready', () => {
  // load persisted extensions
  loadedExtensionsPath = path.resolve('./extensions');
  try {
    const loadedExtensions
      = fs.readdirSync(loadedExtensionsPath).filter((file) => file.startsWith('.') === false).filter((file) => fs.lstatSync(path.join(loadedExtensionsPath, file)).isDirectory());
    if (Array.isArray(loadedExtensions)) {
      for (const extension of loadedExtensions) {
        // Start background pages and set content scripts.
        const manifest = getManifestFromPath(path.join(loadedExtensionsPath, extension));
        loadExtension(manifest);
      }
    }
  } catch (error) {
    // Ignore error
  }

  // the public API to add/remove extensions
  /*
  BrowserWindow.addDevToolsExtension = function (srcDirectory) {
    const manifest = getManifestFromPath(srcDirectory)
    if (manifest) {
      loadExtension(manifest)
      for (const webContents of getAllWebContents()) {
        if (isWindowOrWebView(webContents)) {
          loadDevToolsExtensions(webContents, [manifest])
        }
      }
      return manifest.name
    }
  }

  BrowserWindow.removeDevToolsExtension = function (name) {
    const manifest = manifestNameMap[name]
    if (!manifest) return

    removeBackgroundPages(manifest)
    removeContentScripts(manifest)
    delete manifestMap[manifest.extensionId]
    delete manifestNameMap[name]
  }

  BrowserWindow.getDevToolsExtensions = function () {
    const extensions = {}
    Object.keys(manifestNameMap).forEach(function (name) {
      const manifest = manifestNameMap[name]
      extensions[name] = {name: manifest.name, version: manifest.version}
    })
    return extensions
  }
  */
});

export function addDevToolsExtension (srcDirectory) {
  const manifest = getManifestFromPath(srcDirectory);
    if (manifest) {
      loadExtension(manifest);
      for (const webContents of webContents.getAllWebContents()) {
        if (isWindowOrWebView(webContents)) {
          loadDevToolsExtensions(webContents, [manifest]);
        }
      }
      return manifest.name;
    }
};

export {
  manifestMap,
  manifestNameMap,
};
