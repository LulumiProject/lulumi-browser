import { app, BrowserWindow, ipcMain, webContents } from 'electron';
import { Buffer } from 'buffer';
import { Store } from 'vuex';
import localshortcut from 'electron-localshortcut';
import * as fs from 'fs';
import * as path from 'path';
import generate from 'nanoid/generate';
import * as urllib from 'url';

import config from '../constants';
import './listeners';

/* tslint:disable:no-console */
/* tslint:disable:max-line-length */

const globalObject = global as Lulumi.API.GlobalObject;

// ../../shared/store/mainStore.ts
const { default: mainStore } = require('../../shared/store/mainStore');
const store: Store<any> = mainStore.getStore();

const objectValues = object => Object.keys(object).map(key => object[key]);

globalObject.renderProcessPreferences = [];
// extensionId => manifest
globalObject.manifestMap = {};
// name => manifest
const manifestNameMap: Lulumi.API.ManifestNameMap = {};

const generateExtensionIdFromName = () => generate('abcdefghijklmnopqrstuvwxyz', 32);

// Create or get manifest object from |srcDirectory|.
const getManifestFromPath: (srcDirectory: string) => Lulumi.API.ManifestObject | null =
  (srcDirectory: string): Lulumi.API.ManifestObject | null => {
    let manifest: Lulumi.API.ManifestObject;
    let manifestContent: string;

    try {
      manifestContent = fs.readFileSync(path.join(srcDirectory, 'manifest.json'), 'utf8');
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
      const extensionId = generateExtensionIdFromName();
      globalObject.manifestMap[extensionId] = manifestNameMap[manifest.name] = manifest;

      let messages = {};
      let lang = '';
      try {
        lang = fs.readFileSync(path.join(app.getPath('userData'), 'lulumi-lang'), 'utf8');
      } catch (langError) {
        lang = `"${manifest.default_locale}"`;
        console.error(`(lulumi-browser) ${langError}`);
      }
      if (lang) {
        lang = JSON.parse(lang);
        try {
          messages = JSON.parse(fs.readFileSync(
            path.join(srcDirectory, '_locales', lang.replace('-', '_'), 'messages.json'), 'utf8'));
        } catch (readError) {
          console.warn(`${manifest.name}: Reading messages.json failed.`);
          console.warn(readError.stack || readError);
        }
      }
      messages = Object.assign({
        '@@extension_id': { message: extensionId },
        '@@ui_locale': { message: lang || 'en' },
        // tslint:disable-next-line:align
      }, messages);

      Object.assign(manifest, {
        srcDirectory,
        extensionId,
        messages,
        startPage: urllib.format({
          protocol: 'lulumi-extension',
          slashes: true,
          hostname: extensionId,
          pathname: manifest.devtools_page,
        }),
      });
      return manifest;
    }

    if (manifest && manifest.name) {
      console.warn(`Attempted to load extension "${manifest.name}" that has already been loaded.`);
      return null;
    }
    console.warn('Unable to parse this extension!');
    return null;
  };

// manage the background pages
const backgroundPages: Lulumi.API.BackgroundPages = {};

const startBackgroundPages = (manifest: Lulumi.API.ManifestObject) => {
  if (backgroundPages[manifest.extensionId] || !manifest.background) {
    return;
  }

  let html: Buffer = Buffer.from('');
  let name: string;
  if (manifest.background.page) {
    name = manifest.background.page;
    html = fs.readFileSync(path.join(manifest.srcDirectory, manifest.background.page));
  } else {
    name = '_generated_background_page.html';
    if (manifest.background.scripts) {
      const scripts = manifest.background.scripts.map(name => `<script src="${name}"></script>`).join('');
      html = Buffer.from(`<html><body>${scripts}</body></html>`, 'utf8');
    }
  }

  const contents = (webContents as any).create({
    commandLineSwitches: ['--background-page'],
    isBackgroundPage: true,
    partition: 'persist:__lulumi_extension',
    preload: path.join(config.lulumiPreloadPath, 'extension-preload.js'),
    webSecurity: false,
  });
  backgroundPages[manifest.extensionId] = { html, name, webContentsId: contents.id };
  globalObject.backgroundPages = backgroundPages;
  contents.loadURL(urllib.format({
    protocol: 'lulumi-extension',
    slashes: true,
    hostname: manifest.extensionId,
    pathname: name,
  }));
};

const removeBackgroundPages = (manifest) => {
  const extension = backgroundPages[manifest.extensionId];
  if (extension) {
    const toBeRemovedwebContents
      = (webContents.fromId(extension.webContentsId) as Electron.WebContents);

    ipcMain.once(`lulumi-extension-${manifest.extensionId}-clean-done`, () => {
      (toBeRemovedwebContents as any).destroy();
      delete backgroundPages[manifest.extensionId];
    });
    // notify the extension that itself is going to be removed
    toBeRemovedwebContents.send(`lulumi-extension-${manifest.extensionId}-going-removed`);
  } else {
    // because the extension doesn't have any background page, we should just send an IPC message
    const browserWindow = BrowserWindow.getFocusedWindow();
    if (browserWindow !== null) {
      browserWindow.webContents.send('remove-non-bg-lulumi-extension', manifest.extensionId);
    }
  }
};

const registerLocalCommands = (window: Electron.BrowserWindow, manifest) => {
  const commands = manifest.commands;
  if (commands) {
    Object.keys(commands).forEach((command) => {
      const suggested_key = commands[command].suggested_key;
      if (suggested_key) {
        localshortcut.register(window, suggested_key.default, () => {
          if (commands[command].suggested_key) {
            const browserWindow = BrowserWindow.getFocusedWindow();
            if (command === '_execute_page_action') {
              if (browserWindow !== null) {
                browserWindow.webContents.send('lulumi-commands-execute-page-action', manifest.extensionId);
              }
            } else if (command === '_execute_browser_action') {
              if (browserWindow !== null) {
                browserWindow.webContents.send('lulumi-commands-execute-browser-action', manifest.extensionId);
              }
            } else {
              const extension = backgroundPages[manifest.extensionId];
              if (extension) {
                const wc = webContents.fromId(extension.webContentsId);
                if (wc) {
                  wc.send('lulumi-commands-triggered', command);
                }
              }
            }
          }
        });
        ipcMain.once(`lulumi-extension-${manifest.extensionId}-local-shortcut-unregister`, () => {
          localshortcut.unregister(window, suggested_key.default);
        });
      }
    });
  }
};

const injectContentScripts = (manifest: Lulumi.API.ManifestObject) => {
  if (manifest.content_scripts) {
    const readArrayOfFiles = relativePath => ({
      url: urllib.format({
        protocol: 'lulumi-extension',
        slashes: true,
        hostname: manifest.extensionId,
        pathname: relativePath,
      }),
      code: String(fs.readFileSync(path.join(manifest.srcDirectory, relativePath))),
    });
    const contentScriptToEntry = script => ({
      all_frames: script.all_frames,
      matches: script.matches,
      js: script.js ? script.js.map(readArrayOfFiles) : [],
      css: script.css ? script.css.map(readArrayOfFiles) : [],
      runAt: script.run_at || 'document_idle',
    });

    try {
      manifest.content_scripts = manifest.content_scripts.map(contentScriptToEntry);
    } catch (readError) {
      console.error('Failed to read content scripts', readError);
    }
  }
};

const removeRenderProcessPreferences = (manifest) => {
  globalObject.renderProcessPreferences = globalObject.renderProcessPreferences.filter(el => el.extensionId !== manifest.extensionId);
};

const manifestToExtensionInfo = (manifest: Lulumi.API.ManifestObject): chrome.management.ExtensionInfo => ({
  description: manifest.description || '',
  enabled: false,
  hostPermissions: [],
  id: manifest.extensionId,
  installType: 'development',
  isApp: false,
  mayDisable: false,
  name: manifest.name,
  offlineEnabled: false,
  optionsUrl: manifest.options_page || '',
  permissions: [],
  shortName: '',
  type: 'extension',
  version: manifest.version,
});

// load the extensions for the window
const loadExtension = (manifest: Lulumi.API.ManifestObject) => {
  startBackgroundPages(manifest);
  injectContentScripts(manifest);

  const extensionInfo = manifestToExtensionInfo(manifest);
  store.dispatch('addExtension', {
    extensionInfo,
  });

  globalObject.renderProcessPreferences.push(manifest);
  store.dispatch('updateExtension', {
    enabled: true,
    extensionid: extensionInfo.id,
  });
};

// the lulumi-extension can map a extension URL request to real file path
const lulumiExtensionHandler = (request, callback) => {
  const parsed = urllib.parse(decodeURIComponent(request.url));
  if (!parsed.hostname || !parsed.pathname) {
    return callback();
  }

  const manifest = globalObject.manifestMap[parsed.hostname];
  if (!manifest) {
    return callback();
  }

  const page = backgroundPages[parsed.hostname];
  if (page && parsed.pathname === `/${page.name}`) {
    return callback({
      mimeType: 'text/html',
      data: page.html,
    });
  }

  fs.readFile(path.join(manifest.srcDirectory, parsed.pathname), (err, content) => {
    if (err) {
      return callback(-6); // FILE_NOT_FOUND
    }
    return callback(content);
  });
};

app.on(('session-created' as any), (sess: Electron.Session) => {
  sess.protocol.registerBufferProtocol('lulumi-extension', lulumiExtensionHandler, (error) => {
    if (error) {
      console.error(`Unable to register lulumi-extension protocol: ${error}`);
    }
  });
});

// the persistent path of "Lulumi Extensions" preference file
const loadedExtensionsPath: string = path.join(app.getPath('userData'), 'lulumi-extensions');

app.on('will-quit', () => {
  try {
    const loadedExtensions = objectValues(globalObject.manifestMap).map(manifest => manifest.srcDirectory);
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

app.whenReady().then(() => {
  // the public API to add/remove extensions
  ((BrowserWindow as any) as Lulumi.BrowserWindow).addLulumiExtension = (srcDirectory: string): string => {
    const manifest = getManifestFromPath(srcDirectory);
    if (manifest !== null) {
      loadExtension(manifest);
      return manifest.name;
    }

    return '';
  };

  ((BrowserWindow as any) as Lulumi.BrowserWindow).removeLulumiExtension = (extensionId: string): string => {
    const manifest = globalObject.manifestMap[extensionId];
    if (manifest) {
      removeBackgroundPages(manifest);
      removeRenderProcessPreferences(manifest);
      delete globalObject.manifestMap[manifest.extensionId];
      delete manifestNameMap[manifest.name];
      store.dispatch('removeExtension', {
        extensionId,
      });
      return manifest.name;
    }
    return '';
  };

  ((BrowserWindow as any) as Lulumi.BrowserWindow).getLulumiExtensions = (): any => {
    const extensions = {};
    Object.keys(manifestNameMap).forEach((name) => {
      const manifest = manifestNameMap[name];
      if (manifest) {
        extensions[name] = { name: manifest.name, version: manifest.version };
      }
    });
    return extensions;
  };
});

// we can not use protocol or BrowserWindow until app is ready,
// and hopefully, this function will be called after app is ready
const loadExtensions = () => {
  try {
    const loadedExtensions = JSON.parse(fs.readFileSync(loadedExtensionsPath, 'utf8'));
    if (Array.isArray(loadedExtensions)) {
      for (const srcDirectory of loadedExtensions) {
        // start background pages and set content scripts
        const manifest = getManifestFromPath(srcDirectory);
        if (manifest !== null) {
          loadExtension(manifest);
        }
      }
    }
  } catch (error) {
    // ignore error
  }
};

export default {
  manifestNameMap,
  backgroundPages,
  registerLocalCommands,
  loadExtensions,
};
