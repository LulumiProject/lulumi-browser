import { app, BrowserWindow, nativeImage, webContents } from 'electron';
import { Buffer } from 'buffer';
import localshortcut from 'electron-localshortcut';
import fs from 'fs';
import path from 'path';
import punycode from 'punycode';
import url from 'url';

import config from '../main/js/constants/config';
import './extensions/listeners';

const objectValues = object => Object.keys(object).map(key => object[key]);

global.renderProcessPreferences = [];
// extensionId => manifest
const manifestMap = {};
// name => manifest
const manifestNameMap = {};

const generateExtensionIdFromName = name => punycode.toASCII(name).replace(/[\W_]+/g, '-').toLowerCase();

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
      srcDirectory,
      extensionId,
      startPage: url.format({
        protocol: 'lulumi-extension',
        slashes: true,
        hostname: extensionId,
        pathname: manifest.devtools_page,
      }),
    });
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
  if (manifest.background) {
    if (manifest.background.page) {
      name = manifest.background.page;
      html = fs.readFileSync(path.join(manifest.srcDirectory, manifest.background.page));
    } else {
      name = '_generated_background_page.html';
      const scripts = manifest.background.scripts.map(name => `<script src="${name}"></script>`).join('');
      html = new Buffer(`<html><body>${scripts}</body></html>`);
    }

    const contents = webContents.create({
      partition: 'persist:__lulumi_extension',
      isBackgroundPage: true,
      commandLineSwitches: ['--background-page'],
      preload: path.join(config.lulumiPreloadPath, 'extension-preload.js'),
    });
    backgroundPages[manifest.extensionId] = { html, webContentsId: contents.id, name };
    contents.loadURL(url.format({
      protocol: 'lulumi-extension',
      slashes: true,
      hostname: manifest.extensionId,
      pathname: name,
    }));
  }
};

const removeBackgroundPages = (manifest) => {
  if (!backgroundPages[manifest.extensionId]) {
    return;
  }

  webContents.fromId(backgroundPages[manifest.extensionId].webContentsId).destroy();
  delete backgroundPages[manifest.extensionId];
};

const loadCommands = (mainWindow, manifest) => {
  const commands = manifest.commands;
  if (commands) {
    Object.keys(commands).forEach((command) => {
      const suggested_key = commands[command].suggested_key;
      localshortcut.register(mainWindow, suggested_key.default, () => {
        if (commands[command].suggested_key) {
          if (command === '_execute_page_action') {
            BrowserWindow.fromId(global.wid).webContents.send('lulumi-commands-execute-page-action', manifest.extensionId);
          } else if (command === '_execute_browser_action') {
            BrowserWindow.fromId(global.wid).webContents.send('lulumi-commands-execute-browser-action', manifest.extensionId);
          } else {
            webContents.fromId(backgroundPages[manifest.extensionId].webContentsId)
              .send('lulumi-commands-triggered', command);
          }
        }
      });
    });
  }
};

const injectContentScripts = (manifest, entry) => {
  if (!manifest.content_scripts) {
    return entry;
  }

  const readArrayOfFiles = relativePath => ({
    url: `lulumi-extension://${manifest.extensionId}/${relativePath}`,
    code: String(fs.readFileSync(path.join(manifest.srcDirectory, relativePath))),
  });

  const contentScriptToEntry = script => ({
    matches: script.matches,
    js: script.js === undefined ? undefined : script.js.map(readArrayOfFiles),
    css: script.css === undefined ? undefined : script.css.map(readArrayOfFiles),
    runAt: script.run_at || 'document_idle',
  });

  try {
    entry.contentScripts = manifest.content_scripts.map(contentScriptToEntry);
  } catch (e) {
    console.error('Failed to read content scripts', e);
  }
  return entry;
};

const removeRenderProcessPreferences = (manifest) => {
  global.renderProcessPreferences = global.renderProcessPreferences.filter(el => el.extensionId !== manifest.extensionId);
};

const loadIcons = (manifest, entry) => {
  const readArrayOfFiles = relativePath => ({
    url: `lulumi-extension://${manifest.extensionId}/${relativePath}`,
    code: String(fs.readFileSync(path.join(manifest.srcDirectory, relativePath))),
  });

  const iconsToEntry = (icons) => {
    const object = {};
    Object.keys(icons).forEach((key) => {
      object[key] = nativeImage.createFromPath(path.join(manifest.srcDirectory, icons[key])).toDataURL('image/png');
    });
    return object;
  };

  try {
    if (manifest.icons) {
      entry.icons = iconsToEntry(manifest.icons);
    }
  } catch (e) {
    console.error('Failed to load icons', e);
  }
  return entry;
};

const manifestToExtensionInfo = manifest => ({
  startPage: manifest.startPage,
  srcDirectory: manifest.srcDirectory,
  name: manifest.name,
  extensionId: manifest.extensionId,
  exposeExperimentalAPIs: true,
});

// load the extensions for the window
const loadExtension = (manifest) => {
  let entry = manifestToExtensionInfo(manifest);
  startBackgroundPages(manifest);
  entry = injectContentScripts(manifest, entry);
  entry = loadIcons(manifest, entry);
  global.renderProcessPreferences.push(entry);
};

const loadLulumiExtensions = (win, manifests) => {
  if (!win.devToolsWebContents) {
    return;
  }

  manifests.forEach(loadExtension);

  const extensionInfoArray = manifests.map(manifestToExtensionInfo);
};

app.on('web-contents-created', (event, webContents) => {
  if (!isWindowOrWebView(webContents)) {
    return;
  }

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
      return callback(-6); // FILE_NOT_FOUND
    }
    return callback(content);
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

app.on('will-quit', () => {
  try {
    const loadedExtensions = objectValues(manifestMap).map(manifest => manifest.srcDirectory);
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

// we can not use protocol or BrowserWindow until app is ready
app.once('ready', () => {
  // load persisted extensions
  loadedExtensionsPath = process.env.NODE_ENV === 'development'
    ? path.join(config.devUserData, 'lulumi-extensions')
    : path.join(app.getPath('userData'), 'extensions');
  try {
    const loadedExtensions = JSON.parse(fs.readFileSync(loadedExtensionsPath));
    if (Array.isArray(loadedExtensions)) {
      for (const srcDirectory of loadedExtensions) {
        // start background pages and set content scripts
        const manifest = getManifestFromPath(srcDirectory);
        loadExtension(manifest);
      }
    }
  } catch (error) {
    // ignore error
  }

  // the public API to add/remove extensions
  BrowserWindow.addExtension = (srcDirectory) => {
    const manifest = getManifestFromPath(srcDirectory);
    if (manifest) {
      loadExtension(manifest);
      return manifest.name;
    }
  };

  BrowserWindow.removeExtension = (name) => {
    const manifest = manifestNameMap[name];
    if (!manifest) {
      return;
    }

    removeBackgroundPages(manifest);
    removeRenderProcessPreferences(manifest);
    delete manifestMap[manifest.extensionId];
    delete manifestNameMap[name];
  };

  BrowserWindow.getExtensions = () => {
    const extensions = {};
    Object.keys(manifestNameMap).forEach((name) => {
      const manifest = manifestNameMap[name];
      extensions[name] = { name: manifest.name, version: manifest.version };
    });
    return extensions;
  };
});

export {
  manifestMap,
  manifestNameMap,
  backgroundPages,
  loadCommands,
};
